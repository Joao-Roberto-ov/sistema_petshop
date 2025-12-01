from fastapi import HTTPException
from repositories.venda_repository import RepositorioVenda
from repositories.produto_repository import RepositorioProduto
from bancoDeDados import conectar, encerra_conexao
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from datetime import date
from services.email_service import EmailService
from services.cliente_service import ServicosCliente

class ServicosVenda:
    def __init__(self):
        self.repo = RepositorioVenda()
        self.prod_repo = RepositorioProduto()
        self.email_service = EmailService()
        self.cliente_service = ServicosCliente()

    def registrar_venda(self, dados_venda, funcionario_id: int):
        # (Req 1) Status é removido, backend define como 'Pendente'
        if not dados_venda.itens or len(dados_venda.itens) == 0:
            raise HTTPException(status_code=400, detail="Nenhum item informado na venda.")

        # (Req 3) Validação de leitura: Apenas verifica se há estoque ANTES de criar
        # A baixa real só ocorre no pagamento.
        produtos_cadastrados_atuais = self.prod_repo.buscar_todos_produtos_cadastrados()
        for item_venda in dados_venda.itens:
            if item_venda.tipo == "produto":
                produto_atual = next((p for p in produtos_cadastrados_atuais if p["id"] == item_venda.id_item), None)
                if not produto_atual:
                    raise HTTPException(status_code=404, detail=f"Produto '{item_venda.nome}' não encontrado.")

                estoque_real = int(produto_atual["estoque"])
                if item_venda.quantidade > estoque_real:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Estoque insuficiente para '{item_venda.nome}'. Pedido: {item_venda.quantidade}, Disponível: {estoque_real}"
                    )

        total = sum(item.quantidade * float(item.preco_unitario) for item in dados_venda.itens)

        try:
            venda = self.repo.registrar_venda(funcionario_id, dados_venda, total)
            return {
                "mensagem": "Venda registrada como Pendente.",
                "venda": venda
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao registrar venda: {e}")

    def atualizar_status(self, venda_id: int, novo_status: str):
        # (Req 6) Lógica central de atualização de status

        # 1. Busca a venda atual
        venda = self.repo.get_venda_by_id(venda_id)
        if not venda:
            raise HTTPException(status_code=404, detail="Venda não encontrada")

        # (Req 6) Não pode alterar se não for 'Pendente'
        if venda['status_pagamento'] != 'Pendente':
            raise HTTPException(status_code=400,
                                detail=f"Apenas vendas 'Pendentes' podem ser alteradas. Status atual: {venda['status_pagamento']}.")

        # (Req 4) Valida os novos status
        if novo_status not in ['Pago', 'Cancelado']:
            raise HTTPException(status_code=400, detail="Status inválido. Use 'Pago' ou 'Cancelado'.")

        # 2. Busca itens para processamento (se for 'Pago')
        itens_db = self.repo.buscar_itens_da_venda(venda_id)

        # 3. Executa transação de baixa/agendamento no repositório
        try:
            self.repo.atualizar_status_e_processar(
                venda_id=venda_id,
                novo_status=novo_status,
                itens_venda=itens_db,
                cliente_id=venda['cliente_id'],
                funcionario_id=venda['funcionario_id']
            )
            return {"mensagem": f"Venda {venda_id} atualizada para {novo_status} com sucesso."}
        except Exception as e:
            # Captura erros de estoque que podem ocorrer durante a transação
            raise HTTPException(status_code=500, detail=f"Erro ao processar venda: {str(e)}")

    def listar_vendas_filtradas(self, filtro_status=None, filtro_funcionario=None, filtro_data_inicio=None,
                                filtro_data_fim=None, filtro_cliente_id=None):
        """ (Req 5) Passa os filtros para o repositório """
        return self.repo.get_all_vendas(
            filtro_status=filtro_status,
            filtro_funcionario=filtro_funcionario,
            filtro_data_inicio=filtro_data_inicio,
            filtro_data_fim=filtro_data_fim,
            filtro_cliente_id=filtro_cliente_id
        )

    def buscar_venda_por_id(self, venda_id: int):
        venda = self.repo.get_venda_by_id(venda_id)
        if not venda:
            raise HTTPException(status_code=404, detail="Venda não encontrada.")
        return venda

    def obter_relatorio_servicos_mais_solicitados(self, data_inicio: date, data_fim: date, filtro_status: str = None):
        """
        Obtém o relatório de serviços mais solicitados no período.
        """
        if data_inicio > data_fim:
            raise HTTPException(status_code=400, detail="A data de início não pode ser posterior à data de fim.")

        print(f"🔍 [SERVICE] Gerando relatório de serviços - Período: {data_inicio} a {data_fim} - Status: {filtro_status or 'Todos'}")

        try:
            # Gera o relatório com filtro de status
            relatorio = self.repo.get_relatorio_servicos_mais_solicitados(data_inicio, data_fim, filtro_status)
            print(f"✅ [SERVICE] Relatório de serviços gerado com {len(relatorio)} itens (filtro: {filtro_status or 'Todos'})")

            for i, item in enumerate(relatorio[:5], 1):
                print(f"   {i}. 🛁 {item['nome_servico']}: {item['quantidade_execucoes']} execuções - R$ {item['receita_gerada']:.2f} - Status: {item.get('status', 'N/A')}")

            return relatorio

        except Exception as e:
            print(f"❌ [SERVICE] Erro ao gerar relatório de serviços: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório de serviços: {str(e)}")

    def gerar_csv_relatorio_servicos(self, data_inicio: date, data_fim: date, filtro_status: str = None):
        """
        Gera o relatório de serviços mais solicitados em formato CSV.
        """
        relatorio = self.obter_relatorio_servicos_mais_solicitados(data_inicio, data_fim, filtro_status)

        output = io.StringIO()
        writer = csv.writer(output)

        # Cabeçalho com status
        writer.writerow(['Serviço', 'Quantidade de Execuções', 'Receita Gerada (R$)', 'Status'])

        # Dados
        for item in relatorio:
            writer.writerow([
                item['nome_servico'],
                item['quantidade_execucoes'],
                f"{item['receita_gerada']:.2f}",
                item.get('status', 'N/A')
            ])

        return output.getvalue()

    def gerar_pdf_relatorio_servicos(self, data_inicio: date, data_fim: date, filtro_status: str = None):
        """
        Gera o relatório de serviços mais solicitados em formato PDF.
        """
        relatorio = self.obter_relatorio_servicos_mais_solicitados(data_inicio, data_fim, filtro_status)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Título
        story.append(Paragraph("Relatório de Serviços Mais Solicitados", styles['Title']))
        story.append(Spacer(1, 12))

        # Período e Filtro
        periodo = f"Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"
        story.append(Paragraph(periodo, styles['Normal']))
        
        if filtro_status and filtro_status.lower() != 'todos':
            filtro_info = f"Filtro: {filtro_status}"
            story.append(Paragraph(filtro_info, styles['Normal']))
        
        story.append(Spacer(1, 24))

        # Dados da Tabela
        data = [['Serviço', 'Qtd. Execuções', 'Receita (R$)', 'Status']]

        total_receita = 0

        for item in relatorio:
            receita_formatada = f"R$ {item['receita_gerada']:.2f}".replace('.', ',')
            data.append([
                item['nome_servico'],
                item['quantidade_execucoes'],
                receita_formatada,
                item.get('status', 'N/A')
            ])
            total_receita += item['receita_gerada']

        # Linha de Total
        total_formatado = f"R$ {total_receita:.2f}".replace('.', ',')
        data.append(['', 'Total:', total_formatado, ''])

        # Criação da Tabela
        table = Table(data)

        # Estilo da Tabela (atualizado para 4 colunas)
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 1), (2, -1), 'RIGHT'), # Alinha números à direita
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'), # Total:
            ('FONTNAME', (2, -1), (2, -1), 'Helvetica-Bold'), # Valor Total
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ])

        table.setStyle(style)
        story.append(table)

        doc.build(story)

        buffer.seek(0)
        return buffer.getvalue()

    
    def obter_relatorio_produtos_mais_vendidos(self, data_inicio: date, data_fim: date, filtro_status: str = None):
        """
        Obtém o relatório de produtos mais vendidos no período.
        """
        if data_inicio > data_fim:
            raise HTTPException(status_code=400, detail="A data de início não pode ser posterior à data de fim.")
        
        print(f"🔍 [SERVICE] Gerando relatório de produtos - Período: {data_inicio} a {data_fim}")
        
        try:
            # Gera o relatório (com filtro)
            if hasattr(self.repo, 'get_relatorio_produtos_mais_vendidos') and callable(getattr(self.repo, 'get_relatorio_produtos_mais_vendidos')):
                # Se a função aceita filtro de status
                relatorio = self.repo.get_relatorio_produtos_mais_vendidos(data_inicio, data_fim, filtro_status)
            else:
                # Versão sem filtro
                relatorio = self.repo.get_relatorio_produtos_mais_vendidos(data_inicio, data_fim)
            
            total_pedidos = sum([item.get('total_pedidos', 0) for item in relatorio])
            print(f"✅ [SERVICE] Relatório gerado com {len(relatorio)} produtos - Total pedidos: {total_pedidos}")
            
            for i, item in enumerate(relatorio[:5], 1):
                print(f"   {i}. 📦 {item['nome_produto']}: {item['quantidade_vendida']} unidades - {item['total_pedidos']} pedidos - R$ {item['receita_gerada']:.2f}")
                
            return relatorio
                
        except Exception as e:
            print(f"❌ [SERVICE] Erro ao gerar relatório: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")

    def gerar_csv_relatorio_produtos(self, data_inicio: date, data_fim: date):
        """
        Gera o relatório de produtos mais vendidos em formato CSV.
        """
        relatorio = self.obter_relatorio_produtos_mais_vendidos(data_inicio, data_fim)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow(['Produto', 'Categoria', 'Quantidade Vendida', 'Receita Gerada (R$)'])
        
        # Dados
        for item in relatorio:
            writer.writerow([
                item['nome_produto'],
                item['categoria'],
                item['quantidade_vendida'],
                f"{item['receita_gerada']:.2f}"
            ])
            
        return output.getvalue()

    def gerar_pdf_relatorio_produtos(self, data_inicio: date, data_fim: date):
        """
        Gera o relatório de produtos mais vendidos em formato PDF.
        """
        relatorio = self.obter_relatorio_produtos_mais_vendidos(data_inicio, data_fim)
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Título
        story.append(Paragraph("Relatório de Produtos Mais Vendidos", styles['Title']))
        story.append(Spacer(1, 12))
        
        # Período
        periodo = f"Período: {data_inicio.strftime('%d/%m/%Y')} a {data_fim.strftime('%d/%m/%Y')}"
        story.append(Paragraph(periodo, styles['Normal']))
        story.append(Spacer(1, 24))
        
        # Dados da Tabela
        data = [['Produto', 'Categoria', 'Qtd. Vendida', 'Receita (R$)']]
        
        total_receita = 0
        
        for item in relatorio:
            receita_formatada = f"R$ {item['receita_gerada']:.2f}".replace('.', ',')
            data.append([
                item['nome_produto'],
                item['categoria'],
                item['quantidade_vendida'],
                receita_formatada
            ])
            total_receita += item['receita_gerada']
            
        # Linha de Total
        total_formatado = f"R$ {total_receita:.2f}".replace('.', ',')
        data.append(['', '', 'Total:', total_formatado])
        
        # Criação da Tabela
        table = Table(data)
        
        # Estilo da Tabela
        style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (2, 1), (3, -1), 'RIGHT'), # Alinha números à direita
            ('FONTNAME', (2, -1), (2, -1), 'Helvetica-Bold'), # Total:
            ('FONTNAME', (3, -1), (3, -1), 'Helvetica-Bold'), # Valor Total
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ])
        
        table.setStyle(style)
        story.append(table)
        
        doc.build(story)
        
        buffer.seek(0)
        return buffer.getvalue()
    
    def _gerar_recibo_pdf_bytes(self, venda_id: int) -> bytes:
        """ 
        Gera o PDF do recibo da venda como um array de bytes (buffer).
        """
        venda = self.buscar_venda_por_id(venda_id)
        if not venda:
            raise HTTPException(status_code=404, detail="Venda não encontrada para gerar o PDF.")
            
        # O CÓDIGO INTEIRO DE REPORTLAB DA SUA ROTA /recibo VEM AQUI
        buffer = io.BytesIO()
        # ----------------------------------------------------
        # COMEÇA A LÓGICA DE REPORTLAB (copiada de sua rota /recibo)
        # ----------------------------------------------------
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet
        
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elementos = []

        titulo = Paragraph("<b>RECIBO DE PAGAMENTO</b>", styles["Title"])
        elementos.append(titulo)

        info_cliente = f"""
        <b>Cliente:</b> {venda.get('cliente_nome', 'N/A')}<br/>
        <b>Venda ID:</b> {venda['id']}<br/>
        <b>Data:</b> {venda['criado_em']}<br/>
        <b>Status:</b> {venda['status_pagamento']}<br/>
        """
        elementos.append(Paragraph(info_cliente, styles["Normal"]))
        elementos.append(Paragraph("<br/><b>Itens da Venda:</b>", styles["Heading3"]))

        tabela_data = [["Item", "Qtd", "Preço Unit.", "Subtotal"]]
        total = 0
        for item in venda["itens"]:
            nome = item["nome"]
            qtd = item["quantidade"]
            preco = float(item["preco_unitario"])
            subtotal = qtd * preco
            total += subtotal

            tabela_data.append([
                nome,
                qtd,
                f"R$ {preco:.2f}",
                f"R$ {subtotal:.2f}"
            ])

        tabela = Table(tabela_data, colWidths=[220, 50, 100, 100])
        tabela.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.lightgrey),
            ("GRID", (0,0), (-1,-1), 1, colors.black),
            ("FONT", (0,0), (-1,-1), "Helvetica", 10),
            ("ALIGN", (1,1), (-1,-1), "CENTER"),
        ]))
        elementos.append(tabela)
        elementos.append(Paragraph("<br/>", styles["Normal"]))
        elementos.append(Paragraph(f"<b>Total Pago: R$ {total:.2f}</b>", styles["Heading2"]))
        elementos.append(Paragraph(f"<b>Forma de Pagamento:</b> {venda.get('forma_pagamento', 'Não informado')}", styles["Normal"]))

        doc.build(elementos)
        # ----------------------------------------------------
        # FIM DA LÓGICA DE REPORTLAB
        # ----------------------------------------------------
        
        return buffer.getvalue() # Retorna os bytes

    def enviar_recibo_por_email(self, venda_id: int) -> dict:
        """ 
        Busca a venda, gera o PDF em bytes e envia o e-mail usando EmailService.
        """
        venda = self.buscar_venda_por_id(venda_id)
        
        if not venda:
            return {"sucesso": False, "erro": "Venda não encontrada."}

        cliente_id = venda.get('cliente_id')

        if not cliente_id:
            return {"sucesso": False, "erro": "Venda não possui cliente vinculado (Venda anônima)."}

        cliente = self.cliente_service.buscar_pelo_id(cliente_id)

        if not cliente:
            return {"sucesso": False, "erro": "Cadastro do cliente não encontrado."}

        cliente_email = cliente.get('email')
        # --- FIM DA CORREÇÃO ---
        
        if not cliente_email or "@" not in cliente_email:
            return {"sucesso": False, "erro": f"Cliente da venda {venda_id} não possui e-mail válido."}

        try:
            # 1. Gera o arquivo PDF in-memory (bytes)
            pdf_bytes = self._gerar_recibo_pdf_bytes(venda_id)
            
            # 2. Envia o e-mail usando o serviço implementado
            self.email_service.enviar_recibo_com_anexo(
                destinatario_email=cliente_email,
                venda_id=venda_id,
                pdf_bytes=pdf_bytes
            )
            
            return {"sucesso": True, "email_cliente": cliente_email}
            
        except Exception as e:
            # Log do erro de envio de e-mail
            print(f"❌ Erro ao enviar e-mail da venda {venda_id}: {e}")
            return {"sucesso": False, "erro": f"Falha no envio do recibo: {str(e)}"}