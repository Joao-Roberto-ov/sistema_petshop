from fastapi import HTTPException
from psycopg2 import Error
from modelos import PetCadastro, PetUpdate, PetCadastroFuncionario
from repositories.pet_repository import RepositorioPet
from util.cargos import Cargo

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
                detail="Você já possui um pet cadastrado com o mesmo nome, espécie e raça.")

        try:
            self.repo.cadastrar_pet(pet_dados, cliente_id)
        except Error as e:
            print(f"Erro no banco de dados ao cadastrar pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao cadastrar o pet.")

    def cadastrar_pet_funcionario(self, pet_dados: PetCadastroFuncionario):
        cliente_id = pet_dados.cliente_id
        pet_existente = self.repo.buscar_pet_por_dados(
            cliente_id=cliente_id,
            nome=pet_dados.nome,
            tipo=pet_dados.tipo,
            raca=pet_dados.raca
        )
        if pet_existente:
            raise HTTPException(status_code=409,
                                detail="O cliente já possui um pet cadastrado com o mesmo nome, espécie e raça.")

        try:
            self.repo.cadastrar_pet(pet_dados, cliente_id)
        except Error as e:
            print(f"Erro no banco de dados ao cadastrar pet por funcionário: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao cadastrar o pet.")

    def listar_pets_do_cliente(self, cliente_id: int):
        try:
            pets_data = self.repo.buscar_pets_por_cliente_id(cliente_id)
            pets = [
                {"id": p[0], "nome": p[1], "tipo": p[2], "raca": p[3], "idade": p[4], "peso": p[5], "sexo_biologico": p[6], "observacoes": p[7]}
                for p in pets_data
            ]
            return pets
        except Error as e:
            print(f"Erro no banco de dados ao buscar pets do cliente: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao buscar os pets.")

    def buscar_historico_do_pet(self, pet_id: int, usuario_id: int, user_type: str = None):
        """
        Busca histórico do pet verificando permissões:
        - Clientes só podem ver histórico dos seus próprios pets
        - Veterinários e Gestores podem ver histórico de qualquer pet
        """
        # Se for cliente, verificar se é dono do pet
        if user_type == "cliente":
            self._verificar_dono_do_pet(pet_id, usuario_id)
        else:
            # Se for funcionário, verificar se é veterinário ou gestor
            from repositories.funcionario_repository import RepositorioFuncionario
            repo_funcionario = RepositorioFuncionario()
            funcionario_data = repo_funcionario.procurar_pelo_id(usuario_id)
            
            if funcionario_data:
                cargo_id = funcionario_data.get("cargo_id")
                cargos_permitidos = [Cargo.GESTOR.value, Cargo.VETERINARIO.value]
                if cargo_id not in cargos_permitidos:
                    raise HTTPException(
                        status_code=403,
                        detail="Apenas veterinários e gestores podem visualizar histórico de pets."
                    )
            else:
                # Se não é funcionário nem cliente válido
                raise HTTPException(
                    status_code=403,
                    detail="Acesso negado: tipo de usuário não reconhecido."
                )

        try:
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
        except Error as e:
            print(f"Erro no banco de dados ao buscar histórico do pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao buscar o histórico do pet.")

    def atualizar_pet(self, pet_id: int, pet_dados: PetUpdate, usuario_id: int, user_type: str = None):
        """
        Atualiza um pet verificando permissões:
        - Clientes só podem atualizar seus próprios pets
        - Gestores podem atualizar qualquer pet
        - Veterinários NÃO podem atualizar (apenas visualizar)
        """
        print(f"🔧 atualizar_pet chamado - pet_id: {pet_id}, usuario_id: {usuario_id}, user_type: {user_type}")
        
        # Se for cliente, verificar se é dono do pet
        if user_type == "cliente":
            print(f"👤 Usuário é cliente, verificando dono do pet...")
            self._verificar_dono_do_pet(pet_id, usuario_id)
            funcionario_data = None  # Cliente não é funcionário
        else:
            print(f"👨‍💼 Usuário é funcionário, verificando permissões...")
            # Se for funcionário, verificar permissões
            from repositories.funcionario_repository import RepositorioFuncionario
            repo_funcionario = RepositorioFuncionario()
            funcionario_data = repo_funcionario.procurar_pelo_id(usuario_id)
            
            if funcionario_data:
                cargo_id = funcionario_data.get("cargo_id")
                print(f"📋 Cargo do funcionário: {cargo_id}")
                if cargo_id != Cargo.GESTOR.value:  # Se não é gestor
                    raise HTTPException(
                        status_code=403,
                        detail="Apenas gestores podem editar pets do sistema. Veterinários podem apenas visualizar."
                    )
            else:
                # Se não é funcionário nem cliente válido
                raise HTTPException(
                    status_code=403,
                    detail="Acesso negado: tipo de usuário não reconhecido."
                )

        # Resto do método (verificação de duplicatas e atualização)
        dados_para_atualizar = pet_dados.model_dump(exclude_unset=True)
        print(f"📦 Dados para atualizar: {dados_para_atualizar}")

        if 'nome' in dados_para_atualizar or 'tipo' in dados_para_atualizar or 'raca' in dados_para_atualizar:
            print("🔍 Verificando duplicatas...")
            dados_atuais = self.repo.buscar_dados_atuais_pet(pet_id)
            if not dados_atuais:
                raise HTTPException(status_code=404, detail="Pet não encontrado para verificação.")

            dados_finais = dados_atuais.copy()
            dados_finais.update(dados_para_atualizar)

            # Para clientes, verificar duplicatas apenas nos seus próprios pets
            if not funcionario_data or funcionario_data.get("cargo_id") != Cargo.GESTOR.value:
                print(f"🔍 Verificando duplicatas para cliente (user_id: {usuario_id})")
                pet_duplicado = self.repo.buscar_pet_por_dados(
                    cliente_id=usuario_id,
                    nome=dados_finais['nome'],
                    tipo=dados_finais['tipo'],
                    raca=dados_finais['raca'],
                    pet_id_excluir=pet_id
                )
            else:
                # Para gestores, verificar duplicatas considerando o cliente dono do pet
                cliente_id = dados_atuais.get('cliente_id')
                print(f"🔍 Verificando duplicatas para gestor (cliente_id: {cliente_id})")
                pet_duplicado = self.repo.buscar_pet_por_dados(
                    cliente_id=cliente_id,
                    nome=dados_finais['nome'],
                    tipo=dados_finais['tipo'],
                    raca=dados_finais['raca'],
                    pet_id_excluir=pet_id
                )

            if pet_duplicado:
                raise HTTPException(status_code=409,
                                    detail="A atualização falhou. Já existe outro pet com este mesmo nome, tipo e raça.")

        try:
            print("💾 Atualizando pet no banco de dados...")
            pet_atualizado_data = self.repo.atualizar_pet(pet_id, pet_dados)
            if not pet_atualizado_data:
                raise HTTPException(status_code=404, detail="Pet não encontrado")

            pet = {
                "id": pet_atualizado_data[0], 
                "nome": pet_atualizado_data[1], 
                "tipo": pet_atualizado_data[2],
                "raca": pet_atualizado_data[3], 
                "idade": pet_atualizado_data[4], 
                "peso": pet_atualizado_data[5],
                "sexo_biologico": pet_atualizado_data[6],
                "observacoes": pet_atualizado_data[7]
            }
            print(f"✅ Pet atualizado com sucesso: {pet}")
            return pet
        except Error as e:
            print(f"❌ Erro no banco de dados ao atualizar pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao atualizar o pet.")
        
    def excluir_pet(self, pet_id: int, usuario_id: int):
        """
        Exclui um pet verificando permissões:
        - Clientes só podem excluir seus próprios pets
        - Gestores podem excluir qualquer pet
        - Veterinários NÃO podem excluir
        """
        # Verificar se é funcionário
        from repositories.funcionario_repository import RepositorioFuncionario
        repo_funcionario = RepositorioFuncionario()
        funcionario_data = repo_funcionario.procurar_pelo_id(usuario_id)
        
        if funcionario_data:
            # Se é funcionário, verificar se é gestor
            cargo_id = funcionario_data.get("cargo_id")
            if cargo_id != Cargo.GESTOR.value:  # Se não é gestor
                raise HTTPException(
                    status_code=403,
                    detail="Apenas gestores podem excluir pets do sistema."
                )
        else:
            # Se não é funcionário, verificar se é dono do pet
            self._verificar_dono_do_pet(pet_id, usuario_id)

        try:
            # Verificar se o pet existe
            pet_existe = self.repo.verificar_pet_existe(pet_id)
            if not pet_existe:
                raise HTTPException(status_code=404, detail="Pet não encontrado.")

            # Excluir o pet
            self.repo.excluir_pet(pet_id)
            
        except Error as e:
            print(f"Erro no banco de dados ao excluir pet: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao excluir o pet.")

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
                    "sexo_biologico": p[6],
                    "observacoes": p[7],
                    "dono": { "id": p[8], "nome": p[9] }
                }
                for p in pets_data
            ]
            return pets
        except Error as e:
            print(f"Erro no banco de dados ao buscar todos os pets: {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao buscar os pets.")

    def listar_todos_pets_para_funcionario(self, funcionario_id: int):
        """
        Lista todos os pets do sistema com informações do cliente para funcionários.
        Verifica a permissão do funcionário (Gestor, Veterinário).
        """
        from repositories.funcionario_repository import RepositorioFuncionario
        repo_funcionario = RepositorioFuncionario()
        funcionario_data = repo_funcionario.procurar_pelo_id(funcionario_id)
        
        if not funcionario_data:
            raise HTTPException(status_code=403, detail="Acesso negado")
            
        cargo_id = funcionario_data.get("cargo_id")
        cargos_permitidos = [Cargo.GESTOR.value, Cargo.VETERINARIO.value]  # Gestor e Veterinário
        
        if cargo_id not in cargos_permitidos:
            raise HTTPException(
                status_code=403,
                detail="Apenas gestores e veterinários podem visualizar todos os pets."
            )
            
        return self.listar_todos_pets_para_gestor()

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
                "peso": pet_atualizado_data[5],
                "sexo_biologico": pet_atualizado_data[6],
                "observacoes": pet_atualizado_data[7]
            }
            return pet
        except Error as e:
            print(f"Erro no banco de dados ao atualizar pet (gestor): {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro ao atualizar o pet.")