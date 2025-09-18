from fastapi import HTTPException
from psycopg2 import Error
from modelos import PetCadastro
from repositories.pet_repository import RepositorioPet

class ServicosPet:
    def __init__(self):
        self.repo = RepositorioPet()

    def cadastrar_pet(self, pet_dados: PetCadastro, cliente_id: int):
        try:
            self.repo.cadastrar_pet(pet_dados, cliente_id)
        except Error as e:
            print(f"Erro no banco de dados ao cadastrar pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao cadastrar o pet.")