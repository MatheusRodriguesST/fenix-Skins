import getpass
import json
import steam.webauth as wa

user = wa.MobileWebAuth("seu_username_aqui")  # Substitua pelo seu username

# Login
password = getpass.getpass("Senha Steam: ")
user.login(password=password)

# Adicionar autenticador
resp = user.cli_login()
resp = user.enable_twofactor()

# Salvar segredos em JSON
with open("2FA-secrets.json", "w") as f:
    json.dump(resp, f, indent=4)

print("Segredos salvos em 2FA-secrets.json! Inclui shared_secret e identity_secret.")