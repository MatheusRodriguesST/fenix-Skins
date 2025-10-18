import getpass
import json
import steam.webauth as wa

# Prompt for username
username = input("Username Steam: ")

# Prompt for password securely
password = getpass.getpass("Senha Steam: ")

# Create MobileWebAuth instance
user = wa.MobileWebAuth(username)

# Handle login with retries for common exceptions
logged_in = False
while not logged_in:
    try:
        user.login(password=password)
        logged_in = True
    except wa.LoginIncorrect as e:
        print(f"Erro: {e}. Nome de usuário ou senha incorretos. Tente novamente.")
        password = getpass.getpass("Nova Senha Steam: ")
    except wa.EmailCodeRequired as e:
        print(f"Erro: {e}. Código de verificação enviado para o email.")
        email_code = input("Digite o código do email (Gmail): ")
        try:
            user.login(email_code=email_code)
            logged_in = True
        except Exception as inner_e:
            print(f"Erro ao usar código: {inner_e}. Tente novamente.")
    except wa.CaptchaRequired as e:
        print(f"Erro: {e}. CAPTCHA necessário. Acesse este URL no navegador: {user.captcha_url}")
        captcha = input("Digite o código CAPTCHA: ")
        try:
            user.login(captcha=captcha)
            logged_in = True
        except Exception as inner_e:
            print(f"Erro ao usar CAPTCHA: {inner_e}. Tente novamente.")
    except Exception as e:
        print(f"Erro inesperado no login: {e}")
        break

if not logged_in:
    print("Falha no login. Verifique credenciais e tente novamente.")
    exit()

# Agora habilite o 2FA (enable_twofactor)
try:
    resp = user.enable_twofactor()
    # Salve os segredos em JSON
    with open("2FA-secrets.json", "w") as f:
        json.dump(resp, f, indent=4)
    print("Segredos salvos em 2FA-secrets.json! Inclui shared_secret e identity_secret.")
    print("Agora finalize o setup no app Steam móvel: Abra o app, vá em Steam Guard > Adicionar Autenticador, e confirme com SMS no telefone cadastrado na conta.")
except Exception as e:
    print(f"Erro ao habilitar 2FA: {e}. Certifique-se de que o Steam Guard está desabilitado na conta antes de rodar isso.")

# Dica: Use steam-totp para gerar códigos 2FA mais tarde, ex.: from steam_totp import generate_twofactor_code; print(generate_twofactor_code(resp['shared_secret']))