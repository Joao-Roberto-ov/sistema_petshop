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
        self._verificar_dono_do_pet(pet_id, cliente_id)

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