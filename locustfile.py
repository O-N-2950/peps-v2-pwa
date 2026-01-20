from locust import HttpUser, task, between

class PepsUser(HttpUser):
    # Simule un temps de réflexion humain entre 1 et 5 secondes
    wait_time = between(1, 5)

    @task(3) # Poids 3 : Action fréquente (Recherche Map)
    def view_map(self):
        # Teste le cache Redis sur la recherche
        self.client.get("/api/partners/search_v2?q=&category=all")

    @task(1) # Poids 1 : Action moyenne (Voir packs)
    def view_packs(self):
        self.client.get("/api/packs?currency=CHF")

    @task(1) # Poids 1 : Action rare (Login)
    def login_attempt(self):
        # Teste la charge DB sur l'auth (hashing password)
        self.client.post("/api/login", json={"email": "test_load@peps.swiss", "password": "wrong"})
