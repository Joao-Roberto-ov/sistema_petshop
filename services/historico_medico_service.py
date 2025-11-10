from repositories import historico_medico_repository

def registrar_historico(historico):
    return historico_medico_repository.adicionar_historico(historico)

def buscar_historico_pet(pet_id):
    return historico_medico_repository.obter_historico_por_pet_id(pet_id)

def buscar_detalhes_historico(historico_id):
    return historico_medico_repository.obter_detalhes_historico(historico_id)