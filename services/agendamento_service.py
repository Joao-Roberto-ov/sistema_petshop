from fastapi import HTTPException, status
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional
import psycopg2
from services import historico_medico_service
from modelos import HistoricoMedico
from repositories.agendamento_repository import RepositorioAgendamento
from repositories.servico_repository import RepositorioCatalogoServico
from repositories.pet_repository import RepositorioPet
from repositories.funcionario_repository import RepositorioFuncionario
from services import historico_medico_service
from modelos import HistoricoMedico
from modelos import AgendamentoCreate, HorarioDisponivel, DisponibilidadeResponse, AgendamentoReagendar
from repositories.config_repository import listar_horarios as repo_listar_horarios
from services.email_service import EmailService
from services.notificacao_service import NotificacaoService

INTERVALO_MINUTOS = 15  # Define a granularidade dos slots

# Mapeamento do Python (datetime.weekday()) para os nomes no banco
DIAS_DA_SEMANA_MAP = [
    "Segunda-feira",  # 0
    "Terça-feira",  # 1
    "Quarta-feira",  # 2
    "Quinta-feira",  # 3
    "Sexta-feira",  # 4
    "Sábado",  # 5
    "Domingo"  # 6
]


class ServicosAgendamento:
    def __init__(self):
        self.repo_agendamento = RepositorioAgendamento()
        self.repo_servico = RepositorioCatalogoServico()
        self.repo_pet = RepositorioPet()
        self.repo_funcionario = RepositorioFuncionario()
        self.notificacao_service = NotificacaoService()
        self.email_service = EmailService()
        self._horarios_cache = None

    def _get_horarios_config(self):
        """Busca os horários do banco ou do cache."""
        if self._horarios_cache is None:
            print("INFO: Cache de horários de funcionamento vazio. Buscando do banco...")
            lista_horarios = repo_listar_horarios()
            # Converte a lista de dicts em um mapa para acesso rápido
            self._horarios_cache = {h['dia_semana']: h for h in lista_horarios}
        return self._horarios_cache

    def _get_horario_dia(self, dia: date):
        """Pega os horários de funcionamento específicos para um dia da semana."""
        dia_str = DIAS_DA_SEMANA_MAP[dia.weekday()]
        config_horarios = self._get_horarios_config()

        horario_dia = config_horarios.get(dia_str)

        if not horario_dia:
            raise HTTPException(status_code=500,
                                detail=f"Configuração de horário para '{dia_str}' não encontrada no banco.")

        def str_to_time(time_str):
            """Converte 'HH:MM' (string) para objeto time()"""
            if not time_str or len(time_str) < 5:
                return None
            try:
                return datetime.strptime(time_str[:5], '%H:%M').time()
            except (ValueError, TypeError):
                return None

        # Retorna um dicionário estruturado com os horários do dia
        return {
            "inicio_manha": str_to_time(horario_dia.get("inicio_manha")),
            "fim_manha": str_to_time(horario_dia.get("fim_manha")),
            "manha_ativa": horario_dia.get("manha_ativa", False),
            "inicio_tarde": str_to_time(horario_dia.get("inicio_tarde")),
            "fim_tarde": str_to_time(horario_dia.get("fim_tarde")),
            "tarde_ativa": horario_dia.get("tarde_ativa", False),
        }

    def _atualizar_status_para_ausencia(self, status: str, data_hora_inicio: datetime) -> str:
        """
        Verifica se um agendamento 'Agendado' já passou da data/hora.
        Se sim, retorna 'C/ Ausência'.
        """
        agora = datetime.now(timezone.utc)

        # Garante que a data_hora_inicio tenha timezone para comparação
        data_inicio_tz = data_hora_inicio
        if data_inicio_tz.tzinfo is None:
            data_inicio_tz = data_hora_inicio.replace(tzinfo=timezone.utc)

        if status == 'Agendado' and data_inicio_tz < agora:
            return 'C/ Ausência'

        return status

    def _obter_duracao_servico(self, servico_id: int) -> int:
        """Busca a duração de um serviço pelo ID."""
        servico = self.repo_servico.buscar_por_id(servico_id)
        if not servico:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado.")
        if len(servico) > 3 and isinstance(servico[3], int):
            return servico[3]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Não foi possível obter a duração do serviço.")

    def _calcular_fim_trabalho(self, inicio_servico: datetime, duracao_minutos: int, horario_dia: dict) -> Optional[
        datetime]:
        """
        Calcula o horário de término real de um serviço, pulando o horário de almoço.
        Retorna None se o serviço não couber no dia.
        """
        dia = inicio_servico.date()
        tz = inicio_servico.tzinfo

        # Pega horários do dicionário (podem ser None se o turno estiver inativo ou não definido)
        inicio_manha = datetime.combine(dia, horario_dia["inicio_manha"], tzinfo=tz) if horario_dia["manha_ativa"] and \
                                                                                        horario_dia[
                                                                                            "inicio_manha"] else None
        fim_manha = datetime.combine(dia, horario_dia["fim_manha"], tzinfo=tz) if horario_dia["manha_ativa"] and \
                                                                                  horario_dia["fim_manha"] else None
        inicio_tarde = datetime.combine(dia, horario_dia["inicio_tarde"], tzinfo=tz) if horario_dia["tarde_ativa"] and \
                                                                                        horario_dia[
                                                                                            "inicio_tarde"] else None
        fim_tarde = datetime.combine(dia, horario_dia["fim_tarde"], tzinfo=tz) if horario_dia["tarde_ativa"] and \
                                                                                  horario_dia["fim_tarde"] else None

        minutos_restantes = duracao_minutos
        fim_calculado = inicio_servico

        # Verifica se o início está dentro de um turno ativo
        in_manha = inicio_manha and fim_manha and (inicio_servico >= inicio_manha and inicio_servico < fim_manha)
        in_tarde = inicio_tarde and fim_tarde and (inicio_servico >= inicio_tarde and inicio_servico < fim_tarde)

        if not (in_manha or in_tarde):
            return None  # Começa fora do expediente

        # Serviço começa de manhã
        if in_manha:
            minutos_disponiveis_manha = (fim_manha - inicio_servico).total_seconds() / 60

            if minutos_restantes <= minutos_disponiveis_manha:
                # Serviço termina antes do almoço
                fim_calculado = inicio_servico + timedelta(minutes=minutos_restantes)
                if fim_calculado > fim_manha:
                    return None  # Termina exatamente ou depois do fim da manhã
                return fim_calculado

            # Serviço "pula" o almoço
            else:
                if not (inicio_tarde and fim_tarde):  # Tarde inativa
                    return None  # Não cabe na manhã e não tem tarde

                minutos_restantes -= minutos_disponiveis_manha
                fim_calculado = inicio_tarde + timedelta(minutes=minutos_restantes)
                if fim_calculado > fim_tarde:
                    return None  # Não cabe na tarde
                return fim_calculado

        # Serviço começa a tarde
        elif in_tarde:
            minutos_disponiveis_tarde = (fim_tarde - inicio_servico).total_seconds() / 60

            if minutos_restantes <= minutos_disponiveis_tarde:
                fim_calculado = inicio_servico + timedelta(minutes=minutos_restantes)
                if fim_calculado > fim_tarde:
                    return None
                return fim_calculado
            else:
                return None  # Nao cabe na tarde

        return None  # Fallback

    def _gerar_slots_dia(self, dia: date, horario_dia: dict) -> List[datetime]:
        """Gera todos os slots de *início* possíveis baseado nos turnos ATIVOS."""
        slots_inicio = []
        tz = timezone.utc
        intervalo = timedelta(minutes=INTERVALO_MINUTOS)

        # Manhã (se ativa e horários definidos)
        if horario_dia["manha_ativa"] and horario_dia["inicio_manha"] and horario_dia["fim_manha"]:
            atual = datetime.combine(dia, horario_dia["inicio_manha"], tzinfo=tz)
            fim_manha = datetime.combine(dia, horario_dia["fim_manha"], tzinfo=tz)
            while atual < fim_manha:
                slots_inicio.append(atual)
                atual += intervalo

        # Tarde (se ativa e horários definidos)
        if horario_dia["tarde_ativa"] and horario_dia["inicio_tarde"] and horario_dia["fim_tarde"]:
            atual = datetime.combine(dia, horario_dia["inicio_tarde"], tzinfo=tz)
            fim_tarde = datetime.combine(dia, horario_dia["fim_tarde"], tzinfo=tz)
            while atual < fim_tarde:
                slots_inicio.append(atual)
                atual += intervalo

        return slots_inicio

    def buscar_disponibilidade_servico(self, servico_id: int, data_consulta: date,
                                       agendamento_id_excluir: Optional[int] = None) -> DisponibilidadeResponse:

        # 1. Obter configuração do dia
        try:
            horario_dia = self._get_horario_dia(data_consulta)
        except HTTPException:
            # Dia não encontrado (erro de config), retorna vazio
            return DisponibilidadeResponse(data=data_consulta, horarios=[])

        # 2. VERIFICAÇÃO DE DIA ATIVO (Req 1 & 2)
        if not horario_dia["manha_ativa"] and not horario_dia["tarde_ativa"]:
            print(f"INFO: Tentativa de agendamento em dia inativo: {data_consulta}")
            return DisponibilidadeResponse(data=data_consulta, horarios=[])  # Retorna vazio

        # 3. Obter duração do serviço
        try:
            duracao_servico = self._obter_duracao_servico(servico_id)
        except HTTPException:
            return DisponibilidadeResponse(data=data_consulta, horarios=[])

        tz = timezone.utc
        inicio_dia = datetime.combine(data_consulta, time.min, tzinfo=tz)
        fim_dia = datetime.combine(data_consulta, time.max, tzinfo=tz)

        # busca agendamentos existentes
        agendamentos_existentes_raw = self.repo_agendamento.buscar_agendamentos_por_intervalo(
            inicio_dia,
            fim_dia,
            exclude_id=agendamento_id_excluir
        )
        agendamentos_existentes = [
            (ag[5].replace(tzinfo=timezone.utc), ag[6].replace(tzinfo=timezone.utc)) for ag in
            agendamentos_existentes_raw
        ]

        # 4. GERAR SLOTS (Req 3 - usa a nova função dinâmica)
        slots_inicio_possiveis = self._gerar_slots_dia(data_consulta, horario_dia)

        horarios_disponiveis: List[HorarioDisponivel] = []

        # (Definindo limites para o cálculo do "pulo do almoço")
        fim_manha_dia = datetime.combine(data_consulta, horario_dia["fim_manha"], tzinfo=tz) if horario_dia[
                                                                                                    "manha_ativa"] and \
                                                                                                horario_dia[
                                                                                                    "fim_manha"] else None
        inicio_tarde_dia = datetime.combine(data_consulta, horario_dia["inicio_tarde"], tzinfo=tz) if horario_dia[
                                                                                                          "tarde_ativa"] and \
                                                                                                      horario_dia[
                                                                                                          "inicio_tarde"] else None

        for inicio_potencial in slots_inicio_possiveis:
            # 5. CALCULAR FIM (Req 3 - usa a nova função dinâmica)
            fim_potencial_real = self._calcular_fim_trabalho(inicio_potencial, duracao_servico, horario_dia)

            if fim_potencial_real is None:
                continue  # o serviço nao cabe no dia a partir deste horário de início

            # Definição dos segmentos de tempo que os serviços ocupariam
            segments_to_check = []
            if fim_manha_dia and fim_potencial_real <= fim_manha_dia:  # Serviço termina antes do almoço
                segments_to_check.append((inicio_potencial, fim_potencial_real))
            else:
                # Pula almoço ou começa à tarde
                if fim_manha_dia and inicio_potencial < fim_manha_dia:
                    segments_to_check.append((inicio_potencial, fim_manha_dia))

                if inicio_tarde_dia:
                    start_afternoon_segment = max(inicio_potencial, inicio_tarde_dia)
                    if fim_potencial_real > inicio_tarde_dia:
                        segments_to_check.append((start_afternoon_segment, fim_potencial_real))

            colide = False
            for (seg_inicio, seg_fim) in segments_to_check:
                if (seg_fim - seg_inicio).total_seconds() <= 0:
                    continue
                for (ag_inicio, ag_fim) in agendamentos_existentes:
                    if seg_inicio < ag_fim and seg_fim > ag_inicio:
                        colide = True
                        break
                if colide:
                    break

            if not colide:
                horarios_disponiveis.append(HorarioDisponivel(inicio=inicio_potencial, fim=fim_potencial_real))

        # remove duplicados e ordena
        horarios_unicos = sorted(list({h.inicio: h for h in horarios_disponiveis}.values()), key=lambda x: x.inicio)
        return DisponibilidadeResponse(data=data_consulta, horarios=horarios_unicos)

    def criar_agendamento(self, agendamento_data: AgendamentoCreate, cliente_id_token: int):
        if agendamento_data.cliente_id != cliente_id_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Você só pode criar agendamentos para sua própria conta.")
        pet = self.repo_pet.buscar_pet_por_id_e_cliente_id(agendamento_data.pet_id, cliente_id_token)
        if not pet:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Pet não encontrado ou não pertence a este cliente.")

        # Obter horários do dia selecionado
        horario_dia = self._get_horario_dia(agendamento_data.data_hora_inicio.date())
        if not horario_dia["manha_ativa"] and not horario_dia["tarde_ativa"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="A data selecionada não possui atendimento (dia fechado).")

        try:
            duracao_servico = self._obter_duracao_servico(agendamento_data.servico_id)
        except HTTPException as e:
            raise e

        data_hora_inicio = agendamento_data.data_hora_inicio
        if data_hora_inicio.tzinfo is None:
            data_hora_inicio = data_hora_inicio.replace(tzinfo=timezone.utc)

        # Calcula fim real usando os horários do dia
        data_hora_fim = self._calcular_fim_trabalho(data_hora_inicio, duracao_servico, horario_dia)
        if data_hora_fim is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="O horário solicitado é inválido ou não cabe no expediente.")

        # Verifica conflitos gerais (lógica de segmentos atualizada)
        segments_to_check = []
        dia = data_hora_inicio.date()
        tz = data_hora_inicio.tzinfo
        fim_manha_dia = datetime.combine(dia, horario_dia["fim_manha"], tzinfo=tz) if horario_dia["manha_ativa"] and \
                                                                                      horario_dia["fim_manha"] else None
        inicio_tarde_dia = datetime.combine(dia, horario_dia["inicio_tarde"], tzinfo=tz) if horario_dia[
                                                                                                "tarde_ativa"] and \
                                                                                            horario_dia[
                                                                                                "inicio_tarde"] else None

        if fim_manha_dia and data_hora_fim <= fim_manha_dia:
            segments_to_check.append((data_hora_inicio, data_hora_fim))
        else:
            if fim_manha_dia and data_hora_inicio < fim_manha_dia:
                segments_to_check.append((data_hora_inicio, fim_manha_dia))
            if inicio_tarde_dia:
                start_afternoon_segment = max(data_hora_inicio, inicio_tarde_dia)
                if data_hora_fim > inicio_tarde_dia:
                    segments_to_check.append((start_afternoon_segment, data_hora_fim))

        for (seg_inicio, seg_fim) in segments_to_check:
            if (seg_fim - seg_inicio).total_seconds() <= 0: continue
            agendamentos_colidentes = self.repo_agendamento.buscar_agendamentos_por_intervalo(seg_inicio, seg_fim)
            if agendamentos_colidentes:
                if agendamento_data.funcionario_id:
                    for ag_colidente in agendamentos_colidentes:
                        if ag_colidente[4] == agendamento_data.funcionario_id:
                            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                                detail="O funcionário selecionado já está ocupado neste horário.")
                else:
                    raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                        detail="O horário solicitado já está ocupado.")

        # Criação do Agendamento
        try:
            agendamento_id = self.repo_agendamento.criar_agendamento(
                cliente_id=cliente_id_token,
                pet_id=agendamento_data.pet_id,
                servico_id=agendamento_data.servico_id,
                data_hora_inicio=data_hora_inicio,
                data_hora_fim=data_hora_fim,
                observacoes=agendamento_data.observacoes,
                funcionario_id=agendamento_data.funcionario_id
            )
            return {"id": agendamento_id, "message": "Agendamento criado com sucesso!"}

        except psycopg2.IntegrityError as e:
            # Verifica se o erro foi na constraint específica do funcionário
            if agendamento_data.funcionario_id and 'agendamentos_funcionario_id_data_hora_inicio_key' in str(e).lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="Conflito: O funcionário selecionado já tem um agendamento neste horário.")
            # Verifica erro na constraint do pet
            elif 'agendamentos_pet_id_data_hora_inicio_key' in str(e).lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="Conflito: Este pet já tem um agendamento neste horário.")
            else:
                print(f"Erro de integridade não tratado especificamente: {e}")
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="Conflito ao agendar. O horário pode ter sido ocupado. Tente novamente.")
        except Exception as e:
            print(f"Erro inesperado ao criar agendamento: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Erro interno ao criar agendamento.")

    def listar_agendamentos_cliente(self, cliente_id: int):
        """Lista os agendamentos de um cliente."""
        agendamentos_raw = self.repo_agendamento.buscar_agendamentos_cliente(cliente_id)
        agendamentos = []
        for row in agendamentos_raw:
            status_atualizado = self._atualizar_status_para_ausencia(row[3], row[1])
            agendamentos.append({
                "id": row[0],
                "data_hora_inicio": row[1].isoformat(),
                "data_hora_fim": row[2].isoformat(),
                "status": status_atualizado,
                "servico_nome": row[4],
                "servico_preco": float(row[5]),
                "pet_nome": row[6],
                "funcionario_nome": row[7] or "Não atribuído",
                "status_motivo": row[8],
                "servico_id": row[9],
                "servico_duracao": row[10],
                "pet_id": row[11]
            })
        return agendamentos

    def confirmar_agendamento(self, agendamento_id: int):
        """
        Confirma a presença do cliente no agendamento.
        """
        agendamento = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        ag_status = agendamento[6]

        if ag_status == 'Cancelado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível confirmar um agendamento cancelado.")

        # Atualiza status para 'Confirmado'
        sucesso = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id,
            "Confirmado",
            "Presença confirmada pelo cliente via e-mail"
        )

        if not sucesso:
            raise HTTPException(status_code=500, detail="Erro ao confirmar agendamento.")

        return {"message": "Sua presença foi confirmada com sucesso! Esperamos você."}

    def cancelar_agendamento(self, agendamento_id: int, cliente_id_token: int):
        """
        Cancela um agendamento e notifica o gestor.
        """
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)

        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        ag_id, ag_cliente_id, ag_pet_id, ag_servico_id, ag_inicio, ag_fim, ag_status, *extra = agendamento_raw[:8]
        ag_inicio_tz = ag_inicio.replace(tzinfo=timezone.utc) if ag_inicio.tzinfo is None else ag_inicio

        agendamento = {
            "id": ag_id,
            "cliente_id": ag_cliente_id,
            "data_hora_inicio": ag_inicio_tz,
            "status": ag_status
        }

        if agendamento["cliente_id"] != cliente_id_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Você não tem permissão para cancelar este agendamento.")

        agora = datetime.now(timezone.utc)
        if agendamento["data_hora_inicio"] <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível cancelar um agendamento que já ocorreu ou está em andamento.")

        if agendamento["status"] == 'Cancelado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este agendamento já está cancelado.")

        diferenca_tempo = agendamento["data_hora_inicio"] - agora
        motivo_cancelamento = ""
        if diferenca_tempo > timedelta(hours=24):
            motivo_cancelamento = "Cancelado pelo cliente com antecedência."
        else:
            motivo_cancelamento = "Cancelado pelo cliente com menos de 24h."

        sucesso = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id=agendamento_id,
            novo_status="Cancelado",
            motivo=motivo_cancelamento
        )

        if not sucesso:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Erro ao atualizar o status do agendamento no banco de dados.")

        try:
            # Busca dados para a mensagem (Nome do cliente/pet)
            msg_notificacao = f"O agendamento #{agendamento_id} foi cancelado pelo cliente."
            self.notificacao_service.criar_notificacao(msg_notificacao, "cancelamento")
        except Exception as e:
            print(f"Erro ao criar notificação para o gestor: {e}")

        return {"message": "Agendamento cancelado com sucesso.", "motivo": motivo_cancelamento}

    def processar_lembretes_24h(self):
        """
        Verifica agendamentos próximos e envia e-mails.
        Corrigido para incluir agendamentos de 'hoje' que ainda não foram notificados.
        """
        print("Iniciando processamento de lembretes...")
        agora = datetime.now(timezone.utc)

        inicio_janela = agora
        fim_janela = agora + timedelta(hours=25)

        # Busca agendamentos que ainda não receberam lembrete (flag = false)
        agendamentos_pendentes = self.repo_agendamento.buscar_agendamentos_pendentes_lembrete(inicio_janela, fim_janela)

        count = 0
        for ag in agendamentos_pendentes:
            ag_id = ag[0]
            cliente_id = ag[1]

            try:
                # procura os detalhes completos para montar o e-mail
                detalhes_lista = self.listar_agendamentos_cliente(cliente_id)
                ag_detalhe = next((item for item in detalhes_lista if item["id"] == ag_id), None)

                if ag_detalhe:
                    # procura o email do cliente
                    from repositories.cliente_repository import RepositorioCliente
                    repo_cli = RepositorioCliente()
                    cliente_dados = repo_cli.procurar_pelo_id(cliente_id)

                    if cliente_dados:
                        email_cliente = cliente_dados[2]  # Índice do email

                        # prepara os dados
                        dados_email = {
                            "id": ag_id,
                            "cliente_nome": cliente_dados[1],
                            "pet_nome": ag_detalhe["pet_nome"],
                            "servico_nome": ag_detalhe["servico_nome"],
                            "data_hora_inicio": datetime.fromisoformat(ag_detalhe["data_hora_inicio"])
                        }

                        # envia o email
                        self.email_service.enviar_lembrete_agendamento(email_cliente, dados_email)

                        # marca no banco que foi enviado o lembrete
                        self.repo_agendamento.marcar_lembrete_como_enviado(ag_id)

                        print(f"✅ Lembrete enviado para agendamento #{ag_id}")
                        count += 1
            except Exception as e:
                print(f"❌ Erro ao processar lembrete para agendamento {ag_id}: {e}")

        print(f"Processamento concluído. {count} novos lembretes enviados.")

    def reagendar_agendamento(self, agendamento_id: int, nova_data_hora_inicio: datetime, cliente_id_token: int):
        """
        Reagenda um agendamento existente para um novo horário. (cliente)
        """
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")
        ag_id, ag_cliente_id, ag_pet_id, ag_servico_id, ag_inicio, ag_fim, ag_status, *_ = agendamento_raw[:8]

        if ag_cliente_id != cliente_id_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Você não tem permissão para reagendar este agendamento.")

        if ag_status != 'Agendado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Apenas agendamentos com status 'Agendado' podem ser reagendados.")

        agora = datetime.now(timezone.utc)
        ag_inicio_tz = ag_inicio.replace(tzinfo=timezone.utc) if ag_inicio.tzinfo is None else ag_inicio
        if ag_inicio_tz <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível reagendar um agendamento que já ocorreu ou está em andamento.")

        try:
            duracao_servico = self._obter_duracao_servico(ag_servico_id)
        except HTTPException as e:
            raise e

        if nova_data_hora_inicio.tzinfo is None:
            nova_data_hora_inicio = nova_data_hora_inicio.replace(tzinfo=timezone.utc)

        if nova_data_hora_inicio <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível reagendar para uma data ou hora no passado.")

        # Obter horários do dia
        horario_dia = self._get_horario_dia(nova_data_hora_inicio.date())
        if not horario_dia["manha_ativa"] and not horario_dia["tarde_ativa"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="A data selecionada não possui atendimento (dia fechado).")

        nova_data_hora_fim = self._calcular_fim_trabalho(nova_data_hora_inicio, duracao_servico, horario_dia)

        if nova_data_hora_fim is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="O novo horário selecionado é inválido ou não cabe no expediente.")

        # verificação de conflitos (com segmentos atualizados)
        segments_to_check = []
        dia = nova_data_hora_inicio.date()
        tz = nova_data_hora_inicio.tzinfo
        fim_manha_dia = datetime.combine(dia, horario_dia["fim_manha"], tzinfo=tz) if horario_dia["manha_ativa"] and \
                                                                                      horario_dia["fim_manha"] else None
        inicio_tarde_dia = datetime.combine(dia, horario_dia["inicio_tarde"], tzinfo=tz) if horario_dia[
                                                                                                "tarde_ativa"] and \
                                                                                            horario_dia[
                                                                                                "inicio_tarde"] else None

        if fim_manha_dia and nova_data_hora_fim <= fim_manha_dia:
            segments_to_check.append((nova_data_hora_inicio, nova_data_hora_fim))
        else:
            if fim_manha_dia and nova_data_hora_inicio < fim_manha_dia:
                segments_to_check.append((nova_data_hora_inicio, fim_manha_dia))
            if inicio_tarde_dia:
                start_afternoon_segment = max(nova_data_hora_inicio, inicio_tarde_dia)
                if nova_data_hora_fim > inicio_tarde_dia:
                    segments_to_check.append((start_afternoon_segment, nova_data_hora_fim))

        for (seg_inicio, seg_fim) in segments_to_check:
            if (seg_fim - seg_inicio).total_seconds() <= 0: continue
            agendamentos_colidentes = self.repo_agendamento.buscar_agendamentos_por_intervalo(
                seg_inicio, seg_fim, exclude_id=agendamento_id
            )
            if agendamentos_colidentes:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="O novo horário solicitado já está ocupado.")

        try:
            sucesso = self.repo_agendamento.reagendar_agendamento(
                agendamento_id, nova_data_hora_inicio, nova_data_hora_fim
            )
            if not sucesso:
                raise HTTPException(status_code=500, detail="Erro ao salvar o reagendamento.")

            return {"message": "Agendamento reagendado com sucesso!"}

        except psycopg2.IntegrityError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Conflito ao reagendar. O horário pode ter sido ocupado por outra pessoa. Tente novamente.")
        except Exception as e:
            print(f"Erro inesperado ao reagendar: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao reagendar.")

    def cancelar_agendamento_gestor(self, agendamento_id: int):
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)

        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        ag_id, ag_cliente_id, ag_pet_id, ag_servico_id, ag_inicio, ag_fim, ag_status, *extra = agendamento_raw[:8]
        ag_inicio_tz = ag_inicio.replace(tzinfo=timezone.utc) if ag_inicio.tzinfo is None else ag_inicio

        agendamento = {
            "id": ag_id,
            "data_hora_inicio": ag_inicio_tz,
            "status": ag_status
        }

        agora = datetime.now(timezone.utc)
        if agendamento["data_hora_inicio"] <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível cancelar um agendamento que já ocorreu ou está em andamento.")

        if agendamento["status"] == 'Cancelado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este agendamento já está cancelado.")

        motivo_cancelamento = "Cancelado pelo Gestor"
        sucesso = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id=agendamento_id,
            novo_status="Cancelado",
            motivo=motivo_cancelamento
        )

        if not sucesso:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Erro ao atualizar o status do agendamento.")

        return {"message": "Agendamento cancelado com sucesso pelo gestor."}

    def reagendar_agendamento_gestor(self, agendamento_id: int, nova_data_hora_inicio: datetime):
        """
        Reagenda um agendamento existente para um novo horário (Ação do Gestor).
        """
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")
        ag_id, ag_cliente_id, ag_pet_id, ag_servico_id, ag_inicio, ag_fim, ag_status, *_ = agendamento_raw[:8]

        if ag_status != 'Agendado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Apenas agendamentos com status 'Agendado' podem ser reagendados.")

        agora = datetime.now(timezone.utc)
        ag_inicio_tz = ag_inicio.replace(tzinfo=timezone.utc) if ag_inicio.tzinfo is None else ag_inicio
        if ag_inicio_tz <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível reagendar um agendamento que já ocorreu ou está em andamento.")

        try:
            duracao_servico = self._obter_duracao_servico(ag_servico_id)
        except HTTPException as e:
            raise e

        if nova_data_hora_inicio.tzinfo is None:
            nova_data_hora_inicio = nova_data_hora_inicio.replace(tzinfo=timezone.utc)

        if nova_data_hora_inicio <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível reagendar para uma data ou hora no passado.")

        # Obter horários do dia
        horario_dia = self._get_horario_dia(nova_data_hora_inicio.date())
        if not horario_dia["manha_ativa"] and not horario_dia["tarde_ativa"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="A data selecionada não possui atendimento (dia fechado).")

        nova_data_hora_fim = self._calcular_fim_trabalho(nova_data_hora_inicio, duracao_servico, horario_dia)

        if nova_data_hora_fim is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="O novo horário selecionado é inválido ou não cabe no expediente.")

        # Verificação de conflitos (segmentos atualizados)
        segments_to_check = []
        dia = nova_data_hora_inicio.date()
        tz = nova_data_hora_inicio.tzinfo
        fim_manha_dia = datetime.combine(dia, horario_dia["fim_manha"], tzinfo=tz) if horario_dia["manha_ativa"] and \
                                                                                      horario_dia["fim_manha"] else None
        inicio_tarde_dia = datetime.combine(dia, horario_dia["inicio_tarde"], tzinfo=tz) if horario_dia[
                                                                                                "tarde_ativa"] and \
                                                                                            horario_dia[
                                                                                                "inicio_tarde"] else None

        if fim_manha_dia and nova_data_hora_fim <= fim_manha_dia:
            segments_to_check.append((nova_data_hora_inicio, nova_data_hora_fim))
        else:
            if fim_manha_dia and nova_data_hora_inicio < fim_manha_dia:
                segments_to_check.append((nova_data_hora_inicio, fim_manha_dia))
            if inicio_tarde_dia:
                start_afternoon_segment = max(nova_data_hora_inicio, inicio_tarde_dia)
                if nova_data_hora_fim > inicio_tarde_dia:
                    segments_to_check.append((start_afternoon_segment, nova_data_hora_fim))

        for (seg_inicio, seg_fim) in segments_to_check:
            if (seg_fim - seg_inicio).total_seconds() <= 0: continue
            agendamentos_colidentes = self.repo_agendamento.buscar_agendamentos_por_intervalo(
                seg_inicio, seg_fim, exclude_id=agendamento_id
            )
            if agendamentos_colidentes:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="O novo horário solicitado já está ocupado por outro agendamento.")

        try:
            sucesso = self.repo_agendamento.reagendar_agendamento(
                agendamento_id,
                nova_data_hora_inicio,
                nova_data_hora_fim
            )
            if not sucesso:
                raise HTTPException(status_code=500, detail="Erro ao salvar o reagendamento no banco de dados.")

            self.repo_agendamento.atualizar_status_agendamento(agendamento_id, 'Agendado', 'Reagendado pelo Gestor')

            return {"message": "Agendamento reagendado com sucesso pelo gestor!"}

        except psycopg2.IntegrityError:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Conflito ao reagendar. O horário pode ter sido ocupado. Tente novamente.")
        except Exception as e:
            print(f"Erro inesperado ao reagendar (gestor): {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro interno ao reagendar.")

    def concluir_agendamento(self, agendamento_id: int, funcionario_id: int):
        """
        Marca um agendamento como 'Concluído' e registra no histórico médico do pet.
        """
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        ag_id, ag_cliente_id, ag_pet_id, ag_servico_id, ag_inicio, ag_fim, ag_status, ag_motivo, ag_func_id = agendamento_raw

        if ag_status != 'Agendado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Apenas agendamentos com status 'Agendado' podem ser concluídos. Status atual: {ag_status}")

        # 1. Obter detalhes do serviço e funcionário
        servico = self.repo_servico.buscar_por_id(ag_servico_id)
        if not servico:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço associado não encontrado.")
        servico_nome = servico[1]
        servico_preco = servico[4]

        # 2. Atualizar status do agendamento para 'Concluído'
        sucesso_status = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id=agendamento_id,
            novo_status="Concluído",
            motivo="Serviço concluído e registrado no histórico médico."
        )

        if not sucesso_status:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Erro ao atualizar o status do agendamento para 'Concluído'.")

        # 3. Registrar no histórico médico com detalhes completos
        historico_data = HistoricoMedico(
            pet_id=ag_pet_id,
            tipo_servico=servico_nome,
            data_hora=datetime.now(timezone.utc),
            resumo=f"Serviço de {servico_nome} realizado",
            detalhes=f"""
    Serviço: {servico_nome}
    Data do agendamento: {ag_inicio.strftime('%d/%m/%Y %H:%M')}
    Valor: R$ {servico_preco:.2f}
    Funcionário responsável: ID {funcionario_id}
    Status: Concluído com sucesso

    Detalhes do serviço:
    - Serviço realizado conforme agendamento
    - Pet atendido no horário programado
    - Procedimento executado com sucesso
            """.strip(),
            funcionario_id=funcionario_id,
            valor=servico_preco
        )

        try:
            historico_id = historico_medico_service.registrar_historico(historico_data)
            print(f"✅ Histórico médico registrado com ID: {historico_id}")
        except Exception as e:
            print(f"❌ Falha ao registrar histórico médico para agendamento {agendamento_id}: {e}")
            # Não levantamos exceção para não reverter a conclusão do agendamento

        return {"message": f"Agendamento {agendamento_id} concluído e histórico médico atualizado com sucesso."}

    def listar_agendamentos_proximos(self):
        agendamentos_raw = self.repo_agendamento.buscar_agendamentos_proximos()
        agendamentos = []
        for row in agendamentos_raw:
            agendamentos.append({
                "id": row[0],
                "data_hora_inicio": row[1].isoformat(),
                "data_hora_fim": row[2].isoformat(),
                "status": row[3],
                "servico_nome": row[4],
                "servico_id": row[5],
                "pet_nome": row[6],
                "cliente_nome": row[7],
                "funcionario_id": row[8],
                "funcionario_nome": row[9] or "Não atribuído",
                "pet_id": row[10]
            })
        return agendamentos

    def listar_todos_agendamentos_gestor(self):
        agendamentos_raw = self.repo_agendamento.buscar_todos_agendamentos()
        agendamentos = []
        for row in agendamentos_raw:
            status_atualizado = self._atualizar_status_para_ausencia(row[3], row[1])
            agendamentos.append({
                "id": row[0],
                "data_hora_inicio": row[1].isoformat(),
                "data_hora_fim": row[2].isoformat(),
                "status": status_atualizado,
                "servico_nome": row[4],
                "servico_preco": float(row[5]),
                "pet_nome": row[6],
                "cliente_nome": row[7],
                "funcionario_id": row[8],
                "funcionario_nome": row[9] or "Não atribuído",
                "status_motivo": row[10],
                "pet_id": row[11]
            })
        return agendamentos

    def assumir_agendamento(self, agendamento_id: int, funcionario_id: int):
        """
        Permite que um funcionário assuma um agendamento vago.
        """
        funcionario = self.repo_funcionario.procurar_pelo_id(funcionario_id)
        if not funcionario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado.")

        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        ag_funcionario_id = agendamento_raw[8]

        if ag_funcionario_id is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Este agendamento já foi assumido por outra pessoa.")

        try:
            linhas_afetadas = self.repo_agendamento.atribuir_funcionario(agendamento_id, funcionario_id)

            if linhas_afetadas == 0:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="Este agendamento foi assumido por outra pessoa.")

            return {
                "message": "Agendamento assumido com sucesso!",
                "funcionario_id": funcionario_id,
                "funcionario_nome": funcionario.get("nome")
            }

        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Erro ao assumir agendamento: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Erro interno ao assumir o agendamento.")

    def cancelar_agendamento_via_email(self, agendamento_id: int):
        """
        Cancela o agendamento vindo de um link de e-mail (sem validação de token de usuário).
        """
        # Busca o agendamento
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento_raw:
            # Retorna False para indicar erro
            return False, "Agendamento não encontrado."

        # Desempacota os dados (id, cliente, pet, servico, inicio, fim, status...)
        ag_id, _, _, _, ag_inicio, _, ag_status, *extra = agendamento_raw[:8]

        # Validações
        ag_inicio_tz = ag_inicio.replace(tzinfo=timezone.utc) if ag_inicio.tzinfo is None else ag_inicio
        agora = datetime.now(timezone.utc)

        if ag_status == 'Cancelado':
            return False, "Este agendamento já foi cancelado."

        if ag_inicio_tz <= agora:
            return False, "Não é possível cancelar um agendamento passado."

        # Atualiza status
        sucesso = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id=agendamento_id,
            novo_status="Cancelado",
            motivo="Cancelado pelo cliente via E-mail"
        )

        if sucesso:
            # Notifica o gestor (AC4)
            try:
                msg = f"O agendamento #{agendamento_id} foi cancelado pelo cliente via e-mail."
                self.notificacao_service.criar_notificacao(msg, "cancelamento")
            except Exception as e:
                print(f"Erro ao notificar gestor: {e}")

            return True, "Agendamento cancelado com sucesso."

        return False, "Erro interno ao cancelar."

    def atualizar_status_manual(self, agendamento_id: int, novo_status: str, funcionario_id: int):
        """
        Permite que funcionários alterem status para 'Realizado' ou 'C/ Ausência'.
        Se 'Realizado', registra automaticamente no histórico médico.
        """
        status_permitidos = ["Realizado", "C/ Ausência"]
        if novo_status not in status_permitidos:
            raise HTTPException(status_code=400, detail="Status inválido.")

        agendamento = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento:
            raise HTTPException(status_code=404, detail="Agendamento não encontrado.")

        # Desempacota dados necessários do agendamento para criar o histórico
        ag_id = agendamento[0]
        ag_pet_id = agendamento[2]
        ag_servico_id = agendamento[3]

        sucesso = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id,
            novo_status,
            f"Status alterado manualmente para {novo_status} pelo funcionário {funcionario_id}"
        )

        if not sucesso:
            raise HTTPException(status_code=500, detail="Erro ao atualizar status.")

        if novo_status == "Realizado":
            try:
                # Busca detalhes do serviço (nome e preço)
                servico = self.repo_servico.buscar_por_id(ag_servico_id)
                if servico:
                    servico_nome = servico[1]
                    servico_preco = servico[4]

                    # Cria o objeto de histórico
                    historico_data = HistoricoMedico(
                        pet_id=ag_pet_id,
                        tipo_servico=servico_nome,
                        data_hora=datetime.now(timezone.utc),
                        resumo=f"Serviço de {servico_nome} realizado (Agendamento)",
                        detalhes=f"Serviço concluído via painel de agendamentos. Agendamento #{ag_id}.",
                        funcionario_id=funcionario_id,
                        valor=servico_preco
                    )

                    # Salva na tabela historico_medico
                    historico_medico_service.registrar_historico(historico_data)
                    print(f"✅ Histórico criado automaticamente para o agendamento {ag_id}")

            except Exception as e:
                print(f"⚠️ Erro ao gerar histórico automático: {e}")
                # Não falha a requisição principal, apenas loga o erro

        return {"message": f"Status atualizado para {novo_status}"}