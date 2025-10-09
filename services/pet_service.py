from fastapi import HTTPException
from psycopg2 import Error
from modelos import PetCadastro, PetUpdate
from repositories.pet_repository import RepositorioPet


class ServicosPet:
    def __init__(self):
        self.repo = RepositorioPet()

    def _verificar_dono_do_pet(self, pet_id: int, cliente_id: int):
        """
        Verifica se o pet pertence ao cliente logado para garantir a segurança.
        """
        pet = self.repo.buscar_pet_por_id_e_cliente_id(pet_id, cliente_id)
        if not pet:
            raise HTTPException(status_code=403,
                                detail="Acesso negado: O pet não pertence a este usuário ou não existe.")

    def cadastrar_pet(self, pet_dados: PetCadastro, cliente_id: int):
        pet_existente = self.repo.buscar_pet_por_dados(
            cliente_id=cliente_id,
            nome=pet_dados.nome,
            tipo=pet_dados.tipo,
            raca=pet_dados.raca
        )
        if pet_existente:
            raise HTTPException(status_code=409,
                                detail="Você já possui um pet cadastrado com o mesmo nome, tipo e raça.")

        try:
            self.repo.cadastrar_pet(pet_dados, cliente_id)
        except Error as e:
            print(f"Erro no banco de dados ao cadastrar pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao cadastrar o pet.")

    def listar_pets_do_cliente(self, cliente_id: int):
        pets_data = self.repo.buscar_pets_por_cliente_id(cliente_id)
        pets = [
            {"id": p[0], "nome": p[1], "tipo": p[2], "raca": p[3], "idade": p[4], "peso": p[5]}
            for p in pets_data
        ]
        return pets

    def buscar_historico_do_pet(self, pet_id: int, cliente_id: int):
        # 1. VERIFICAÇÃO DE SEGURANÇA QUE ESTAVA FALTANDO
        self._verificar_dono_do_pet(pet_id, cliente_id)

        # 2. Lógica original para buscar os dados
        consultas_data = self.repo.buscar_consultas_por_pet_id(pet_id)
        servicos_data = self.repo.buscar_servicos_por_pet_id(pet_id)

        consultas = [
            {"servico_realizado": c[0], "funcionario": c[1], "data_hora": c[2], "valor": float(c[3])}
            for c in consultas_data
        ]
        servicos = [
            {"servico_realizado": s[0], "funcionario": s[1], "data_hora": s[2], "valor": float(s[3])}
            for s in servicos_data
        ]
        return {"consultas": consultas, "servicos": servicos}

    def atualizar_pet(self, pet_id: int, pet_dados: PetUpdate, cliente_id: int):
        self._verificar_dono_do_pet(pet_id, cliente_id)

        dados_para_atualizar = pet_dados.model_dump(exclude_unset=True)

        if 'nome' in dados_para_atualizar or 'tipo' in dados_para_atualizar or 'raca' in dados_para_atualizar:
            dados_atuais = self.repo.buscar_dados_atuais_pet(pet_id)
            if not dados_atuais:
                raise HTTPException(status_code=404, detail="Pet não encontrado para verificação.")

            dados_finais = dados_atuais.copy()
            dados_finais.update(dados_para_atualizar)

            pet_duplicado = self.repo.buscar_pet_por_dados(
                cliente_id=cliente_id,
                nome=dados_finais['nome'],
                tipo=dados_finais['tipo'],
                raca=dados_finais['raca'],
                pet_id_excluir=pet_id
            )
            if pet_duplicado:
                raise HTTPException(status_code=409,
                                    detail="A atualização falhou. Você já possui outro pet com este mesmo nome, tipo e raça.")

        try:
            pet_atualizado_data = self.repo.atualizar_pet(pet_id, pet_dados)
            if not pet_atualizado_data:
                raise HTTPException(status_code=404, detail="Pet não encontrado")

            pet = {"id": pet_atualizado_data[0], "nome": pet_atualizado_data[1], "tipo": pet_atualizado_data[2],
                   "raca": pet_atualizado_data[3], "idade": pet_atualizado_data[4], "peso": pet_atualizado_data[5]}
            return pet
        except Error as e:
            print(f"Erro no banco de dados ao atualizar pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao atualizar o pet.")


    def listar_todos_pets_para_gestor(self):
        """
        Lista todos os pets do sistema com informações do cliente para gestores.
        """
        try:
            pets_data = self.repo.buscar_todos_pets_com_cliente()
            pets = [
                {
                    "id": p[0], 
                    "nome": p[1], 
                    "tipo": p[2], 
                    "raca": p[3], 
                    "idade": p[4], 
                    "peso": p[5],
                    "cliente_id": p[6],
                    "cliente_nome": p[7]
                }
                for p in pets_data
            ]
            return pets
        except Error as e:
            print(f"Erro no banco de dados ao buscar todos os pets: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao buscar os pets.")

    def atualizar_pet_gestor(self, pet_id: int, pet_dados: PetUpdate):
        """
        Permite que gestores atualizem qualquer pet do sistema, sem verificação de proprietário.
        """
        dados_para_atualizar = pet_dados.model_dump(exclude_unset=True)

        # Verificar se pet existe
        pet_existe = self.repo.verificar_pet_existe(pet_id)
        if not pet_existe:
            raise HTTPException(status_code=404, detail="Pet não encontrado.")

        # Se está alterando nome, tipo ou raça, verificar duplicatas
        if 'nome' in dados_para_atualizar or 'tipo' in dados_para_atualizar or 'raca' in dados_para_atualizar:
            dados_atuais = self.repo.buscar_dados_atuais_pet(pet_id)
            if not dados_atuais:
                raise HTTPException(status_code=404, detail="Pet não encontrado para verificação.")

            # Obter cliente_id do pet
            cliente_id = dados_atuais.get('cliente_id')
            
            dados_finais = dados_atuais.copy()
            dados_finais.update(dados_para_atualizar)

            pet_duplicado = self.repo.buscar_pet_por_dados(
                cliente_id=cliente_id,
                nome=dados_finais['nome'],
                tipo=dados_finais['tipo'],
                raca=dados_finais['raca'],
                pet_id_excluir=pet_id
            )
            if pet_duplicado:
                raise HTTPException(status_code=409,
                                    detail="A atualização falhou. Este cliente já possui outro pet com este mesmo nome, tipo e raça.")

        try:
            pet_atualizado_data = self.repo.atualizar_pet(pet_id, pet_dados)
            if not pet_atualizado_data:
                raise HTTPException(status_code=404, detail="Pet não encontrado")

            pet = {
                "id": pet_atualizado_data[0], 
                "nome": pet_atualizado_data[1], 
                "tipo": pet_atualizado_data[2],
                "raca": pet_atualizado_data[3], 
                "idade": pet_atualizado_data[4], 
                "peso": pet_atualizado_data[5]
            }
            return pet
        except Error as e:
            print(f"Erro no banco de dados ao atualizar pet (gestor): {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao atualizar o pet.")
