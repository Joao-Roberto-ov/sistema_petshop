from bancoDeDados import conectar, encerra_conexao
from modelos import PetUpdate

class RepositorioPet:
    def cadastrar_pet(self, pet_dados, cliente_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                  INSERT INTO Pets (nome, tipo, raca, idade, peso, sexo_biologico, observacoes, cliente_id)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                  """
            cursor.execute(sql, (pet_dados.nome, pet_dados.tipo, pet_dados.raca, pet_dados.idade, pet_dados.peso, pet_dados.sexo_biologico, pet_dados.observacoes, cliente_id))
            conn.commit()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pet_por_dados(self, cliente_id: int, nome: str, tipo: str, raca: str, pet_id_excluir: int = None):

        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql_base = "SELECT id FROM Pets WHERE cliente_id = %s AND nome ILIKE %s AND tipo ILIKE %s AND raca ILIKE %s"
            params = [cliente_id, nome, tipo, raca]

            if pet_id_excluir is not None:
                sql_base += " AND id != %s"
                params.append(pet_id_excluir)

            cursor.execute(sql_base, params)
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_dados_atuais_pet(self, pet_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT nome, tipo, raca FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            resultado = cursor.fetchone()

            if resultado:
                return {"nome": resultado[0], "tipo": resultado[1], "raca": resultado[2]}
            return None

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pets_por_cliente_id(self, cliente_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, tipo, raca, idade, peso, sexo_biologico, observacoes FROM Pets WHERE cliente_id = %s ORDER BY nome"
            cursor.execute(sql, (cliente_id,))
            return cursor.fetchall()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pet_por_id(self, pet_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id, nome, tipo, raca, idade, peso, sexo_biologico, observacoes, cliente_id FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_pet_por_id_e_cliente_id(self, pet_id: int, cliente_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id FROM Pets WHERE id = %s AND cliente_id = %s"
            cursor.execute(sql, (pet_id, cliente_id))
            return cursor.fetchone()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_consultas_por_pet_id(self, pet_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT servico_realizado, funcionario, data_hora, valor FROM HistoricoConsultas WHERE pet_id = %s ORDER BY data_hora DESC"
            cursor.execute(sql, (pet_id,))
            return cursor.fetchall()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_servicos_por_pet_id(self, pet_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()

            sql = "SELECT servico_realizado, funcionario, data_hora, valor FROM HistoricoServicos WHERE pet_id = %s ORDER BY data_hora DESC"
            cursor.execute(sql, (pet_id,))

            return cursor.fetchall()

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def transferir_pet(self, pet_id: int, novo_cliente_id: int):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            
            print(f"=== INICIANDO TRANSFERÊNCIA DO PET {pet_id} PARA CLIENTE {novo_cliente_id} ===")
            
            # 1. Primeiro verificar se o pet existe e pegar o cliente atual
            cursor.execute("SELECT id, nome, cliente_id FROM Pets WHERE id = %s", (pet_id,))
            pet_data = cursor.fetchone()
            if not pet_data:
                raise Exception(f"Pet com ID {pet_id} não encontrado")
            
            pet_id_db, pet_nome, cliente_atual_id = pet_data
            print(f"Pet encontrado: {pet_nome} (ID: {pet_id_db}), Dono atual: {cliente_atual_id}")
            
            # 2. Verificar se o novo cliente existe
            cursor.execute("SELECT id, nome FROM Clientes WHERE id = %s", (novo_cliente_id,))
            novo_cliente_data = cursor.fetchone()
            if not novo_cliente_data:
                raise Exception(f"Cliente com ID {novo_cliente_id} não encontrado")
            
            novo_cliente_id_db, novo_cliente_nome = novo_cliente_data
            print(f"Novo dono: {novo_cliente_nome} (ID: {novo_cliente_id_db})")
            
            # 3. Verificar se não é a mesma pessoa
            if cliente_atual_id == novo_cliente_id:
                raise Exception("O novo dono não pode ser o mesmo que o dono atual")
            
            # 4. Atualizar o cliente_id do pet
            sql_pet = "UPDATE Pets SET cliente_id = %s WHERE id = %s"
            cursor.execute(sql_pet, (novo_cliente_id, pet_id))
            print(f"UPDATE Pets: cliente_id = {novo_cliente_id} WHERE id = {pet_id}")
            
            # 5. Verificar se as atualizações foram aplicadas
            rows_affected = cursor.rowcount
            print(f"Linhas afetadas na atualização: {rows_affected}")
            
            if rows_affected == 0:
                raise Exception("Nenhuma linha foi atualizada - pet não encontrado ou dados iguais")
            
            conn.commit()
            print(f"✅ TRANSFERÊNCIA CONCLUÍDA: Pet '{pet_nome}' transferido de {cliente_atual_id} para {novo_cliente_nome}")

        except Exception as e:
            print(f"❌ ERRO NA TRANSFERÊNCIA: {e}")
            if conn:
                conn.rollback()
            raise e
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def verificar_transferencia(self, pet_id: int):
        """
        Verifica se a transferência foi aplicada corretamente
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            cursor.execute("SELECT id, nome, cliente_id FROM Pets WHERE id = %s", (pet_id,))
            return cursor.fetchone()
        except Exception as e:
            print(f"Erro ao verificar transferência: {e}")
            return None
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)
            
    def atualizar_pet(self, pet_id: int, pet_dados: PetUpdate):
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            update_data = pet_dados.model_dump(exclude_unset=True)

            if not update_data:
                cursor.execute("SELECT id, nome, tipo, raca, idade, peso FROM Pets WHERE id = %s", (pet_id,))
                return cursor.fetchone()

            set_clause = ", ".join([f"{key} = %s" for key in update_data.keys()])
            sql = f"UPDATE Pets SET {set_clause} WHERE id = %s RETURNING id, nome, tipo, raca, idade, peso, sexo_biologico, observacoes"
            valores = list(update_data.values()) + [pet_id]
            cursor.execute(sql, valores)
            pet_atualizado = cursor.fetchone()

            conn.commit()
            return pet_atualizado

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)
            
    def buscar_todos_pets_com_cliente(self):
        """
        Busca todos os pets do sistema com informações do cliente para gestores.
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                SELECT 
                    p.id, 
                    p.nome, 
                    p.tipo, 
                    p.raca, 
                    p.idade, 
                    p.peso, 
                    p.sexo_biologico, 
                    p.observacoes, 
                    p.cliente_id, 
                    c.nome as cliente_nome,
                    c.email as cliente_email
                FROM Pets p
                LEFT JOIN Clientes c ON p.cliente_id = c.id
                ORDER BY p.nome, c.nome
            """
            cursor.execute(sql)
            return cursor.fetchall()

        except Exception as e:
            print(f"Erro ao buscar todos os pets com cliente: {e}")
            raise
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def verificar_pet_existe(self, pet_id: int):
        """
        Verifica se um pet existe no sistema.
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT id FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            return cursor.fetchone() is not None

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)

    def buscar_dados_atuais_pet(self, pet_id: int):
        """
        Busca dados atuais do pet incluindo cliente_id para gestores.
        """
        conn = None
        cursor = None

        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = "SELECT nome, tipo, raca, cliente_id FROM Pets WHERE id = %s"
            cursor.execute(sql, (pet_id,))
            resultado = cursor.fetchone()

            if resultado:
                return {
                    "nome": resultado[0], 
                    "tipo": resultado[1], 
                    "raca": resultado[2],
                    "cliente_id": resultado[3]
                }
            return None

        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)
    def buscar_pet_por_id(self, pet_id: int):
        """
        Busca um pet pelo ID
        """
        conn = None
        cursor = None
        try:
            conn = conectar()
            cursor = conn.cursor()
            sql = """
                SELECT id, nome, tipo, raca, idade, peso, sexo_biologico, observacoes, cliente_id
                FROM Pets 
                WHERE id = %s
            """
            cursor.execute(sql, (pet_id,))
            return cursor.fetchone()
        except Exception as e:
            print(f"Erro ao buscar pet por ID: {e}")
            return None
        finally:
            if cursor: cursor.close()
            if conn: encerra_conexao(conn)