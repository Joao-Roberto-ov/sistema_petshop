from bancoDeDados import conectar, encerra_conexao
from datetime import datetime, timezone
from typing import List, Tuple, Optional
import psycopg2
from psycopg2 import sql  # Para construção segura de queries


class RepositorioAgendamento:

    def criar_agendamento(self, cliente_id: int, pet_id: int, servico_id: int, data_hora_inicio: datetime,
                          data_hora_fim: datetime, observacoes: Optional[str] = None,
                          funcionario_id: Optional[int] = None) -> int:
        # cria um novo agendamento e retorna o id
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        INSERT INTO Agendamentos (cliente_id, pet_id, servico_id, data_hora_inicio, data_hora_fim, \
                                                  observacoes, funcionario_id, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id; \
                        """
            cursor.execute(sql_query, (
                cliente_id, pet_id, servico_id, data_hora_inicio, data_hora_fim,
                observacoes, funcionario_id, 'Agendado'
            ))
            agendamento_id = cursor.fetchone()[0]
            conn.commit()
            return agendamento_id
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
            print(f"Erro ao criar agendamento no banco: {e}")
            # verifica se é erro de concorrencia
            if e.pgcode == '23505':
                # verifica qual constraint ta dando erro
                if 'agendamentos_funcionario_id_data_hora_inicio_key' in str(e).lower():
                    raise psycopg2.IntegrityError(
                        "Conflito: O funcionário selecionado já tem um agendamento neste horário.")
                elif 'agendamentos_pet_id_data_hora_inicio_key' in str(e).lower():
                    raise psycopg2.IntegrityError("Conflito: Este pet já tem um agendamento neste horário.")
                else:
                    raise psycopg2.IntegrityError("Conflito de horário ao criar agendamento.")  # Mensagem mais genérica
            raise
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_agendamentos_por_intervalo(self, inicio: datetime, fim: datetime, exclude_id: Optional[int] = None) -> \
    List[Tuple]:
        # procura os agendamentos que colidem com um intervalo, opcionalmente excluindo um id
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        SELECT id, \
                               cliente_id, \
                               pet_id, \
                               servico_id, \
                               funcionario_id, \
                               data_hora_inicio, \
                               data_hora_fim, \
                               status
                        FROM Agendamentos
                        WHERE status != 'Cancelado' \
                          AND data_hora_inicio < %s \
                          AND data_hora_fim > %s \
                        """
            params = [fim, inicio]

            if exclude_id is not None:
                sql_query += " AND id != %s"
                params.append(exclude_id)

            sql_query += " ORDER BY data_hora_inicio;"

            cursor.execute(sql_query, tuple(params))
            return cursor.fetchall()
        except psycopg2.Error as e:
            print(f"Erro ao buscar agendamentos por intervalo: {e}")
            return []
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_agendamentos_cliente(self, cliente_id: int) -> List[Tuple]:
        # procura todos os agendamentos de um cliente específico
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        SELECT a.id, \
                               a.data_hora_inicio, \
                               a.data_hora_fim, \
                               a.status,
                               s.nome    as servico_nome, \
                               s.preco   as servico_preco,
                               p.nome    as pet_nome,
                               f.nome    as funcionario_nome,
                               a.status_motivo,
                               s.id      as servico_id,
                               s.duracao as servico_duracao,
                               p.id      as pet_id
                        FROM Agendamentos a
                                 JOIN catalogo_servicos s ON a.servico_id = s.id
                                 JOIN Pets p ON a.pet_id = p.id
                                 LEFT JOIN Funcionarios f ON a.funcionario_id = f.id
                        WHERE a.cliente_id = %s
                        ORDER BY a.data_hora_inicio DESC; \
                        """
            cursor.execute(sql_query, (cliente_id,))
            return cursor.fetchall()
        except psycopg2.Error as e:
            print(f"Erro ao buscar agendamentos do cliente {cliente_id}: {e}")
            return []
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_agendamento_por_id(self, agendamento_id: int) -> Optional[Tuple]:
        # busca um agendamento específico pelo ID
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        SELECT id, \
                               cliente_id, \
                               pet_id, \
                               servico_id, \
                               data_hora_inicio, \
                               data_hora_fim, \
                               status, \
                               status_motivo, \
                               funcionario_id
                        FROM Agendamentos
                        WHERE id = %s; \
                        """
            cursor.execute(sql_query, (agendamento_id,))
            return cursor.fetchone()
        except psycopg2.Error as e:
            print(f"Erro ao buscar agendamento por ID {agendamento_id}: {e}")
            return None
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def reagendar_agendamento(self, agendamento_id: int, nova_data_hora_inicio: datetime,
                              nova_data_hora_fim: datetime, motivo: str = "Reagendado pelo cliente") -> bool:
        # atualiza a data, a hora e o motivo de um agendamento existente.
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        UPDATE Agendamentos
                        SET data_hora_inicio = %s,
                            data_hora_fim    = %s,
                            status           = 'Agendado',
                            status_motivo    = %s
                        WHERE id = %s;
                        """
            cursor.execute(sql_query, (nova_data_hora_inicio, nova_data_hora_fim, motivo, agendamento_id))
            conn.commit()
            return cursor.rowcount > 0
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
            print(f"Erro ao reagendar agendamento {agendamento_id}: {e}")
            if e.pgcode == '23505':
                raise psycopg2.IntegrityError("Conflito de horário ao reagendar.")
            return False
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def atualizar_status_agendamento(self, agendamento_id: int, novo_status: str, motivo: str) -> bool:
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        UPDATE Agendamentos
                        SET status        = %s, \
                            status_motivo = %s
                        WHERE id = %s; \
                        """
            cursor.execute(sql_query, (novo_status, motivo, agendamento_id))
            conn.commit()
            return cursor.rowcount > 0
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
            print(f"Erro ao atualizar status do agendamento {agendamento_id}: {e}")
            return False
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_agendamentos_proximos(self) -> List[Tuple]:
        # procura todos os agendamentos futuros para o dashboard de funcionários.

        conn = None
        cursor = None
        agora = datetime.now(timezone.utc)
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        SELECT a.id,
                               a.data_hora_inicio,
                               a.data_hora_fim,
                               a.status,
                               s.nome as servico_nome,
                               s.id   as servico_id,
                               p.nome as pet_nome,
                               c.nome as cliente_nome,
                               a.funcionario_id,
                               f.nome as funcionario_nome,
                               p.id   as pet_id
                        FROM Agendamentos a
                                 JOIN catalogo_servicos s ON a.servico_id = s.id
                                 JOIN Pets p ON a.pet_id = p.id
                                 JOIN Clientes c ON a.cliente_id = c.id
                                 LEFT JOIN Funcionarios f ON a.funcionario_id = f.id
                        WHERE a.status = 'Agendado'
                          AND a.data_hora_inicio > %s
                        ORDER BY a.data_hora_inicio ASC; \
                        """
            cursor.execute(sql_query, (agora,))
            return cursor.fetchall()
        except psycopg2.Error as e:
            print(f"Erro ao buscar agendamentos próximos: {e}")
            return []
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_todos_agendamentos(self) -> List[Tuple]:
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        SELECT a.id,
                               a.data_hora_inicio,
                               a.data_hora_fim,
                               a.status,
                               s.nome  as servico_nome,
                               s.preco as servico_preco,
                               p.nome  as pet_nome,
                               c.nome  as cliente_nome,
                               a.funcionario_id,
                               f.nome  as funcionario_nome,
                               a.status_motivo,
                               p.id    as pet_id
                        FROM Agendamentos a
                                 JOIN catalogo_servicos s ON a.servico_id = s.id
                                 JOIN Pets p ON a.pet_id = p.id
                                 JOIN Clientes c ON a.cliente_id = c.id
                                 LEFT JOIN Funcionarios f ON a.funcionario_id = f.id
                        ORDER BY a.data_hora_inicio DESC; \
                        """
            cursor.execute(sql_query)
            return cursor.fetchall()
        except psycopg2.Error as e:
            print(f"Erro ao buscar todos os agendamentos: {e}")
            return []
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def atribuir_funcionario(self, agendamento_id: int, funcionario_id: int) -> int:
        """
        Atribui um funcionário a um agendamento que ainda não tem um.
        Usa "WHERE funcionario_id IS NULL" para evitar race conditions.
        Retorna o número de linhas afetadas (1 para sucesso, 0 para falha/já assumido).
        """
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        UPDATE Agendamentos
                        SET funcionario_id = %s
                        WHERE id = %s \
                          AND funcionario_id IS NULL; \
                        """
            cursor.execute(sql_query, (funcionario_id, agendamento_id))
            conn.commit()
            return cursor.rowcount  # Retorna 1 se foi bem-sucedido, 0 se não
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
            print(f"Erro ao atribuir funcionário ao agendamento {agendamento_id}: {e}")
            raise
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    # --- INÍCIO DA NOVA FUNÇÃO ---
    def atualizar_agendamentos_passados_para_ausente(self, agora: datetime) -> int:
        """
        Atualiza o status de todos os agendamentos "Agendados" que já passaram
        para "Cancelado" com o motivo "Cancelado por ausência do pet".
        Retorna o número de linhas afetadas.
        """
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_query = """
                        UPDATE Agendamentos
                        SET status        = 'Cancelado',
                            status_motivo = 'Cancelado por ausência do pet'
                        WHERE status = 'Agendado'
                          AND data_hora_inicio < %s; \
                        """
            cursor.execute(sql_query, (agora,))
            linhas_afetadas = cursor.rowcount
            conn.commit()
            if linhas_afetadas > 0:
                print(f"Verificação de ausência: {linhas_afetadas} agendamentos atualizados para 'Ausente'.")
            return linhas_afetadas
        except psycopg2.Error as e:
            if conn:
                conn.rollback()
            print(f"Erro ao atualizar agendamentos passados para ausente: {e}")
            raise
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)