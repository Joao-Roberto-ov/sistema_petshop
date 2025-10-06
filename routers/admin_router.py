from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated
from seguranca import decodifica_token
from modelos import FuncionarioCadastroPorAdmin
from routers.cliente_router import pegar_servicos_cliente
from services.funcionario_service import ServicosFuncionario
from services.cliente_service import ServicosCliente
from util.cargos import Cargo

router = APIRouter(prefix="/admin", tags=["Admin"]) 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

@router.post("/funcionarios/cadastro", status_code=status.HTTP_201_CREATED)
async def cadastrar_funcionario_admin(
    funcionario: FuncionarioCadastroPorAdmin,
    token: Annotated[str, Depends(oauth2_scheme)],
    servico_funcionario: ServicosFuncionario = Depends()
):
    token_data = decodifica_token(token)
    
    user_type = token_data.get("tipo") if token_data else None
    cargo_id = token_data.get("cargo_id") if token_data else None
    
    cargos_admin = [1, 2, 405, 524]  # IDs dos cargos administrativos
    
    if not token_data or user_type != "funcionario" or cargo_id not in cargos_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas administradores podem cadastrar funcionários.")
    
    # AC3: Validação de dados obrigatórios (nome, email, senha, cargo_id, cpf, telefone, endereco)
    if not funcionario.nome or not funcionario.email or not funcionario.senha or not funcionario.cargo_id or not funcionario.cpf or not funcionario.telefone or not funcionario.endereco:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Todos os campos obrigatórios devem ser preenchidos.")

    try:
        user_id = servico_funcionario.cadastrar_funcionario_por_admin(funcionario)
        return {"message": "Funcionário cadastrado com sucesso!", "id": user_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao cadastrar funcionário: {str(e)}")
    

@router.put("/clientes/{cliente_id}/status", status_code=status.HTTP_200_OK)
async def rota_desativar_cliente(
    cliente_id: int,
    is_ativo: bool,
    token: Annotated[str, Depends(oauth2_scheme)],
    servico_cliente: ServicosCliente = Depends(pegar_servicos_cliente)
):
    try:
        print(f"=== ENDPOINT ADMIN CHAMADO ===")
        print(f"Cliente ID: {cliente_id}")
        print(f"Status: {is_ativo}")
        print(f"Token recebido: {token[:20]}..." if token else "❌ Token não recebido")
        
        token_data = decodifica_token(token)
        
        # Verificar se token_data é None
        if not token_data:
            print("❌ Token inválido ou expirado")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido ou expirado"
            )
        
        print(f"Token data: {token_data}")
        
        user_type = token_data.get("tipo")
        cargo_id = token_data.get("cargo_id")
        
        print(f"Tipo de usuário: {user_type}")
        print(f"Cargo ID: {cargo_id}")
        
        # Verificar se é funcionário
        if user_type != "funcionario":
            print("❌ Permissão negada - não é funcionário")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas funcionários podem acessar esta funcionalidade.")
        
        # Verificar pelos IDs corretos dos cargos administrativos
        cargos_admin = [1, 2, 405, 524]  # Todos os IDs que são considerados administradores
        
        if cargo_id not in cargos_admin:
            print(f"❌ Permissão negada - cargo_id {cargo_id} não é administrador")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas administradores podem alterar o status de clientes.")
        
        print(f"✅ Permissão concedida - é administrador (cargo_id: {cargo_id})")
        return servico_cliente.desativar_cliente(cliente_id, is_ativo)
        
    except HTTPException as e:
        print(f"❌ HTTPException: {e.detail}")
        raise e
    except Exception as e:
        print(f"❌ Erro interno: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao alterar status do cliente: {str(e)}")
