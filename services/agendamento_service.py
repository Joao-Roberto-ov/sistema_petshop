from fastapi import HTTPException, status
# --- INÍCIO DA MODIFICAÇÃO ---
from datetime import date, datetime, time, timedelta, timezone
# --- FIM DA MODIFICAÇÃO ---
from typing import List, Optional
import psycopg2
from repositories.agendamento_repository import RepositorioAgendamento
from repositories.servico_repository import RepositorioCatalogoServico
from repositories.pet_repository import RepositorioPet
from repositories.funcionario_repository import RepositorioFuncionario
from modelos import AgendamentoCreate, HorarioDisponivel, DisponibilidadeResponse, AgendamentoReagendar

HORA_INICIO_MANHA = time(7, 0)
HORA_FIM_MANHA = time(11, 30)
HORA_INICIO_TARDE = time(14, 0)
HORA_FIM_TARDE = time(18, 0)
INTERVALO_MINUTOS = 15  # Define a granularidade dos slots (ex: de 15 em 15 minutos)


class ServicosAgendamento:
    def __init__(self):
        self.repo_agendamento = RepositorioAgendamento()
        self.repo_servico = RepositorioCatalogoServico()
        self.repo_pet = RepositorioPet()
        self.repo_funcionario = RepositorioFuncionario()

    # --- INÍCIO DA NOVA FUNÇÃO HELPER ---
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

    # --- FIM DA NOVA FUNÇÃO HELPER ---

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

    def _calcular_fim_trabalho(self, inicio_servico: datetime, duracao_minutos: int) -> Optional[datetime]:
        """
        Calcula o horário de término real de um serviço, pulando o horário de almoço.
        Retorna None se o serviço não couber no dia.
        """
        dia = inicio_servico.date()
        tz = inicio_servico.tzinfo

        # define os limites do dia de trabalho com timezone
        inicio_manha = datetime.combine(dia, HORA_INICIO_MANHA, tzinfo=tz)
        fim_manha = datetime.combine(dia, HORA_FIM_MANHA, tzinfo=tz)
        inicio_tarde = datetime.combine(dia, HORA_INICIO_TARDE, tzinfo=tz)
        fim_tarde = datetime.combine(dia, HORA_FIM_TARDE, tzinfo=tz)

        minutos_restantes = duracao_minutos
        fim_calculado = inicio_servico

        # serviço deve começar dentro do horario de trabalho
        if not ((inicio_servico >= inicio_manha and inicio_servico < fim_manha) or \
                (inicio_servico >= inicio_tarde and inicio_servico < fim_tarde)):
            return None

        # serviço começa de manhã
        if inicio_servico < fim_manha:
            minutos_disponiveis_manha = (fim_manha - inicio_servico).total_seconds() / 60

            if minutos_restantes <= minutos_disponiveis_manha:
                # Serviço termina antes do almoço
                fim_calculado = inicio_servico + timedelta(minutes=minutos_restantes)
                # Verifica se o término calculado exatamente no fim da manhã ou antes
                if fim_calculado > fim_manha:
                    return None  # Não pode terminar depois do fim da manhã
                return fim_calculado
            else:
                minutos_restantes -= minutos_disponiveis_manha
                fim_calculado = inicio_tarde + timedelta(minutes=minutos_restantes)
                if fim_calculado > fim_tarde:
                    return None
                return fim_calculado

        # serviço começa a tarde
        elif inicio_servico >= inicio_tarde:
            minutos_disponiveis_tarde = (fim_tarde - inicio_servico).total_seconds() / 60

            if minutos_restantes <= minutos_disponiveis_tarde:
                fim_calculado = inicio_servico + timedelta(minutes=minutos_restantes)
                # Verifica se o fim calculado ultrapassa o fim do expediente da tarde
                if fim_calculado > fim_tarde:
                    return None
                return fim_calculado
            else:
                # nao cabe na tarde
                return None
        if fim_calculado > fim_tarde:
            return None

        return fim_calculado  # Retorno padrão caso a lógica acima falhe (improvável)

    def _gerar_slots_dia(self, dia: date) -> List[datetime]:
        """Gera todos os slots de *início* possíveis dentro do horário de funcionamento."""
        slots_inicio = []
        tz = timezone.utc
        intervalo = timedelta(minutes=INTERVALO_MINUTOS)

        # Manhã
        atual = datetime.combine(dia, HORA_INICIO_MANHA, tzinfo=tz)
        fim_manha = datetime.combine(dia, HORA_FIM_MANHA, tzinfo=tz)
        while atual < fim_manha:
            slots_inicio.append(atual)
            atual += intervalo

        # Tarde
        atual = datetime.combine(dia, HORA_INICIO_TARDE, tzinfo=tz)
        fim_tarde = datetime.combine(dia, HORA_FIM_TARDE, tzinfo=tz)
        while atual < fim_tarde:
            slots_inicio.append(atual)
            atual += intervalo

        return slots_inicio

    def buscar_disponibilidade_servico(self, servico_id: int, data_consulta: date,
                                       agendamento_id_excluir: Optional[int] = None) -> DisponibilidadeResponse:
        """
        Calcula os horários de início disponíveis para um serviço,
        opcionalmente ignorando um agendamento existente (para reagendamento).
        """
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
            # garante que as datas/horas do banco tenham timezone UTC
            (ag[5].replace(tzinfo=timezone.utc), ag[6].replace(tzinfo=timezone.utc)) for ag in
            agendamentos_existentes_raw
        ]

        # cria todos os slots de inicio possíveis no dia
        slots_inicio_possiveis = self._gerar_slots_dia(data_consulta)

        horarios_disponiveis: List[HorarioDisponivel] = []

        fim_manha_dia = datetime.combine(data_consulta, HORA_FIM_MANHA, tzinfo=tz)
        inicio_tarde_dia = datetime.combine(data_consulta, HORA_INICIO_TARDE, tzinfo=tz)

        for inicio_potencial in slots_inicio_possiveis:
            # calcula o fim real do serviço a partir deste inicio, considerando o almoço
            fim_potencial_real = self._calcular_fim_trabalho(inicio_potencial, duracao_servico)

            if fim_potencial_real is None:
                continue  # oserviço nao cabe no dia a partir deste horário de início

            # defini os segmentos de tempo que os serviços ocupariam
            segments_to_check = []
            if fim_potencial_real <= fim_manha_dia:  # Serviço termina antes do almoço
                segments_to_check.append((inicio_potencial, fim_potencial_real))
            else:
                # Segmento da manhã (se o serviço começa antes do fim da manhã)
                if inicio_potencial < fim_manha_dia:
                    segments_to_check.append((inicio_potencial, fim_manha_dia))
                # O início do segmento da tarde é o MAIOR entre o início do serviço e o início da tarde
                start_afternoon_segment = max(inicio_potencial, inicio_tarde_dia)
                if fim_potencial_real > inicio_tarde_dia:
                    segments_to_check.append((start_afternoon_segment, fim_potencial_real))

            # valida se algum desses segmentos colide com agendamentos existentes
            colide = False
            for (seg_inicio, seg_fim) in segments_to_check:
                # Ignora segmentos inválidos (duração zero ou negativa)
                if (seg_fim - seg_inicio).total_seconds() <= 0:
                    continue
                # Verifica colisão com cada agendamento existente
                for (ag_inicio, ag_fim) in agendamentos_existentes:
                    if seg_inicio < ag_fim and seg_fim > ag_inicio:
                        colide = True
                        break  # Se colidiu com um, não precisa verificar os outros
                if colide:
                    break  # Se um segmento colidiu, o slot não está disponível

            # adiciona o horário a lista de disponíveis
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
        try:
            duracao_servico = self._obter_duracao_servico(agendamento_data.servico_id)
        except HTTPException as e:
            raise e

        data_hora_inicio = agendamento_data.data_hora_inicio
        if data_hora_inicio.tzinfo is None:
            data_hora_inicio = data_hora_inicio.replace(tzinfo=timezone.utc)

        # Calcula fim real
        data_hora_fim = self._calcular_fim_trabalho(data_hora_inicio, duracao_servico)
        if data_hora_fim is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="O horário solicitado é inválido ou não cabe no expediente.")

        # Verifica conflitos gerais
        segments_to_check = []
        dia = data_hora_inicio.date()
        tz = data_hora_inicio.tzinfo
        fim_manha_dia = datetime.combine(dia, HORA_FIM_MANHA, tzinfo=tz)
        inicio_tarde_dia = datetime.combine(dia, HORA_INICIO_TARDE, tzinfo=tz)

        if data_hora_fim <= fim_manha_dia:
            segments_to_check.append((data_hora_inicio, data_hora_fim))
        else:
            if data_hora_inicio < fim_manha_dia:
                segments_to_check.append((data_hora_inicio, fim_manha_dia))
            start_afternoon_segment = max(data_hora_inicio, inicio_tarde_dia)
            if data_hora_fim > inicio_tarde_dia:
                segments_to_check.append((start_afternoon_segment, data_hora_fim))

        for (seg_inicio, seg_fim) in segments_to_check:
            if (seg_fim - seg_inicio).total_seconds() <= 0: continue
            agendamentos_colidentes = self.repo_agendamento.buscar_agendamentos_por_intervalo(seg_inicio, seg_fim)
            if agendamentos_colidentes:
                # Verifica se a colisão é com o funcionário específico, se um foi escolhido
                if agendamento_data.funcionario_id:
                    for ag_colidente in agendamentos_colidentes:
                        if ag_colidente[4] == agendamento_data.funcionario_id:
                            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                                detail="O funcionário selecionado já está ocupado neste horário.")
                else:
                    # Se nenhum funcionário foi escolhido, qualquer colisão geral impede
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
        # mapeamento atualizado para incluir servico_id, duracao e pet_id
        for row in agendamentos_raw:
            # --- INÍCIO DA MODIFICAÇÃO (Cliente) ---
            # row[3] é o status, row[1] é data_hora_inicio
            status_atualizado = self._atualizar_status_para_ausencia(row[3], row[1])
            # --- FIM DA MODIFICAÇÃO (Cliente) ---

            agendamentos.append({
                "id": row[0],
                "data_hora_inicio": row[1].isoformat(),
                "data_hora_fim": row[2].isoformat(),
                "status": status_atualizado,  # <-- Variável atualizada
                "servico_nome": row[4],
                "servico_preco": float(row[5]),
                "pet_nome": row[6],
                "funcionario_nome": row[7] or "Não atribuído",
                "status_motivo": row[8],
                "servico_id": row[9],  # ID do serviço
                "servico_duracao": row[10],  # Duração do serviço
                "pet_id": row[11]  # ID do pet
            })
        return agendamentos

    def cancelar_agendamento(self, agendamento_id: int, cliente_id_token: int):
        """
        Cancela um agendamento, aplicando as regras de negócio
        """
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)

        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        # Desempacota incluindo o status_motivo se ele existir na tupla
        ag_id, ag_cliente_id, ag_pet_id, ag_servico_id, ag_inicio, ag_fim, ag_status, *extra = agendamento_raw[:8]
        ag_status_motivo = extra[0] if extra else None  # Pega o motivo se existir

        # Garante timezone para comparação
        ag_inicio_tz = ag_inicio.replace(tzinfo=timezone.utc) if ag_inicio.tzinfo is None else ag_inicio

        agendamento = {
            "id": ag_id,
            "cliente_id": ag_cliente_id,
            "data_hora_inicio": ag_inicio_tz,
            "status": ag_status
        }

        # Verifica permissão
        if agendamento["cliente_id"] != cliente_id_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Você não tem permissão para cancelar este agendamento.")

        # Verifica se já ocorreu
        agora = datetime.now(timezone.utc)
        if agendamento["data_hora_inicio"] <= agora:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Não é possível cancelar um agendamento que já ocorreu ou está em andamento.")

        # Verifica se já está cancelado
        if agendamento["status"] == 'Cancelado':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este agendamento já está cancelado.")

        # Define o motivo do cancelamento
        diferenca_tempo = agendamento["data_hora_inicio"] - agora
        motivo_cancelamento = ""
        if diferenca_tempo > timedelta(hours=24):
            motivo_cancelamento = "Cancelado pelo cliente com antecedência."
        else:
            motivo_cancelamento = "Cancelado pelo cliente com menos de 24h."

        # Atualiza o status no banco
        sucesso = self.repo_agendamento.atualizar_status_agendamento(
            agendamento_id=agendamento_id,
            novo_status="Cancelado",
            motivo=motivo_cancelamento
        )

        if not sucesso:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Erro ao atualizar o status do agendamento no banco de dados.")

        return {"message": "Agendamento cancelado com sucesso.", "motivo": motivo_cancelamento}

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

        nova_data_hora_fim = self._calcular_fim_trabalho(nova_data_hora_inicio, duracao_servico)

        if nova_data_hora_fim is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="O novo horário selecionado é inválido ou não cabe no expediente.")

        # verificação de conflitos
        segments_to_check = []
        dia = nova_data_hora_inicio.date()
        tz = nova_data_hora_inicio.tzinfo
        fim_manha_dia = datetime.combine(dia, HORA_FIM_MANHA, tzinfo=tz)
        inicio_tarde_dia = datetime.combine(dia, HORA_INICIO_TARDE, tzinfo=tz)
        if nova_data_hora_fim <= fim_manha_dia:
            segments_to_check.append((nova_data_hora_inicio, nova_data_hora_fim))
        else:
            if nova_data_hora_inicio < fim_manha_dia: segments_to_check.append((nova_data_hora_inicio, fim_manha_dia))
            start_afternoon_segment = max(nova_data_hora_inicio, inicio_tarde_dia)
            if nova_data_hora_fim > inicio_tarde_dia: segments_to_check.append(
                (start_afternoon_segment, nova_data_hora_fim))

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

        # Ajuste no desempacotamento
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
        # Ajuste no desempacotamento
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

        nova_data_hora_fim = self._calcular_fim_trabalho(nova_data_hora_inicio, duracao_servico)

        if nova_data_hora_fim is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="O novo horário selecionado é inválido ou não cabe no expediente.")

        segments_to_check = []
        dia = nova_data_hora_inicio.date()
        tz = nova_data_hora_inicio.tzinfo
        fim_manha_dia = datetime.combine(dia, HORA_FIM_MANHA, tzinfo=tz)
        inicio_tarde_dia = datetime.combine(dia, HORA_INICIO_TARDE, tzinfo=tz)
        if nova_data_hora_fim <= fim_manha_dia:
            segments_to_check.append((nova_data_hora_inicio, nova_data_hora_fim))
        else:
            if nova_data_hora_inicio < fim_manha_dia: segments_to_check.append((nova_data_hora_inicio, fim_manha_dia))
            start_afternoon_segment = max(nova_data_hora_inicio, inicio_tarde_dia)
            if nova_data_hora_fim > inicio_tarde_dia: segments_to_check.append(
                (start_afternoon_segment, nova_data_hora_fim))

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
            # --- INÍCIO DA MODIFICAÇÃO (Gestor) ---
            # row[3] é o status, row[1] é data_hora_inicio
            status_atualizado = self._atualizar_status_para_ausencia(row[3], row[1])
            # --- FIM DA MODIFICAÇÃO (Gestor) ---

            agendamentos.append({
                "id": row[0],
                "data_hora_inicio": row[1].isoformat(),
                "data_hora_fim": row[2].isoformat(),
                "status": status_atualizado,  # <-- Variável atualizada
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
        # 1. Buscar dados do funcionário (para retornar o nome)
        funcionario = self.repo_funcionario.procurar_pelo_id(funcionario_id)
        if not funcionario:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Funcionário não encontrado.")

        # 2. Verificar se o agendamento existe e está vago
        agendamento_raw = self.repo_agendamento.buscar_agendamento_por_id(agendamento_id)
        if not agendamento_raw:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado.")

        ag_funcionario_id = agendamento_raw[8]  # O índice 8 é o funcionario_id na tupla

        if ag_funcionario_id is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Este agendamento já foi assumido por outro funcionário.")

        # 3. Tentar atribuir o funcionário ao agendamento
        try:
            linhas_afetadas = self.repo_agendamento.atribuir_funcionario(agendamento_id, funcionario_id)

            # 4. Verificar se a atribuição foi bem-sucedida (evita race condition)
            if linhas_afetadas == 0:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="Este agendamento foi assumido por outra pessoa.")

            # 5. Retornar sucesso
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