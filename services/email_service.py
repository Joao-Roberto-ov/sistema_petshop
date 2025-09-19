# Arquivo completo e corrigido para: services/email_service.py

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.email_user = os.getenv("EMAIL_HOST_USER")
        self.email_password = os.getenv("EMAIL_HOST_PASSWORD")
        self.sender_name = "Equipe PetLife"

        if not self.email_user or not self.email_password:
            print("AVISO: Credenciais de e-mail (EMAIL_HOST_USER/PASSWORD) não encontradas no .env. O serviço de e-mail não funcionará.")
            self.is_configured = False
        else:
            self.is_configured = True

    def _enviar_email(self, destinatario_email: str, assunto: str, corpo_html: str):
        if not self.is_configured:
            print(f"SIMULAÇÃO (credenciais ausentes): E-mail para {destinatario_email} com assunto '{assunto}'")
            return

        try:
            msg = MIMEMultipart()
            msg['From'] = formataddr((self.sender_name, self.email_user))
            msg['To'] = destinatario_email
            msg['Subject'] = assunto
            msg.attach(MIMEText(corpo_html, 'html'))

            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                server.sendmail(self.email_user, destinatario_email, msg.as_string())
            
            print(f"E-mail real (via Gmail) enviado com sucesso para: {destinatario_email}")

        except Exception as e:
            print(f"ERRO AO ENVIAR E-MAIL (Gmail): {e}")

    def enviar_codigo_reset(self, destinatario_email: str, codigo: str):
        assunto = "Seu Código de Verificação PetLife"
        corpo_html = f"""
        <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body>
            <p>Olá,</p>
            <p>Use o código a seguir para alterar sua senha na plataforma PetLife:</p>
            <h2 style="text-align:center; color:#4a9b8e; font-size: 24px; letter-spacing: 2px;">{codigo}</h2>
            <p>Este código é válido por 10 minutos.</p>  

            <p>Atenciosamente,</p><p><strong>{self.sender_name}</strong></p>
        </body></html>
        """
        self._enviar_email(destinatario_email, assunto, corpo_html)

    # --- MÉTODO ATUALIZADO ---
    def notificar_alteracao_perfil(self, destinatario_email: str, campos_modificados: list):
        """
        Envia um e-mail notificando o usuário sobre alterações em seu perfil,
        mostrando o valor antigo e o novo.
        """
        assunto = "Seu Perfil PetLife foi Atualizado"

        # Gera o HTML para cada campo modificado
        detalhes_html = ""
        for item in campos_modificados:
            detalhes_html += f"""
            <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #4a9b8e; background-color: #f5f5f5;">
                <h4 style="margin: 0 0 5px 0;">- {item['campo']}</h4>
                <p style="margin: 0; font-size: 12px; color: #777;">Valor anterior: {item['antigo']}</p>
                <p style="margin: 0; font-size: 14px; color: #333;"><b>Novo valor: {item['novo']}</b></p>
            </div>
            """

        corpo_html = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: sans-serif; }}
            </style>
        </head>
        <body>
            <p>Olá,</p>
            <p>Este é um aviso de que as seguintes informações em seu perfil PetLife foram atualizadas recentemente:</p>
            {detalhes_html}
            <p>Se você realizou esta alteração, nenhuma ação é necessária.</p>
            <p>Se você não reconhece esta atividade, por favor, altere sua senha imediatamente e entre em contato com nosso suporte.</p>
              

            <p>Atenciosamente,</p>
            <p><strong>{self.sender_name}</strong></p>
        </body>
        </html>
        """
        self._enviar_email(destinatario_email, assunto, corpo_html)

