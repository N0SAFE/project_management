# Documentation de l'API d'authentification

## Endpoints

### 1. Inscription d'un utilisateur
- **URL** : `/api/auth/register`
- **Méthode** : `POST`
- **Description** : Permet à un visiteur de s'inscrire avec un nom d'utilisateur, une adresse email et un mot de passe.
- **Corps de la requête (JSON)** :
```json
{
  "username": "string (min 3, max 50)",
  "email": "string (email, unique)",
  "password": "string (min 6)"
}
```
- **Réponse (200)** :
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com"
}
```
- **Réponse (400)** :
```json
{
  "error": "Email already in use"
}
```

### 2. Connexion d'un utilisateur
- **URL** : `/api/auth/login`
- **Méthode** : `POST`
- **Description** : Permet à un utilisateur inscrit de se connecter avec son email et son mot de passe.
- **Corps de la requête (JSON)** :
```json
{
  "email": "string (email)",
  "password": "string"
}
```
- **Réponse (200)** :
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com"
}
```
- **Réponse (401)** :
```json
{
  "error": "Invalid credentials"
}
```

## Contraintes de validation
- `username` : requis, 3 à 50 caractères
- `email` : requis, format email, unique
- `password` : requis, minimum 6 caractères

## Sécurité
- Les mots de passe sont stockés de façon sécurisée (hashés avec BCrypt).
- Aucun mot de passe n'est jamais retourné dans les réponses API.
