import numpy as np
from faker import Faker
from datetime import date, timedelta
from sqlalchemy.orm import Session
import logging
from app.models.customer import Customer
from app.models.account import Account
from app.models.loan import Loan

logger = logging.getLogger("bank_twin")
fake = Faker()


def get_rng():
    return np.random.default_rng()


def generate_customers(n: int = 5000):
    rng = get_rng()
    customers = []
    for _ in range(n):
        age = int(np.clip(rng.normal(40, 15), 18, 85))
        income = float(np.clip(rng.lognormal(10.8, 0.5), 15_000, 500_000))
        credit_score = int(np.clip(rng.normal(680, 80), 300, 850))
        employment = rng.choice(
            ["employed", "self-employed", "unemployed", "retired"],
            p=[0.65, 0.15, 0.08, 0.12],
        )
        customers.append(
            Customer(
                name=fake.name(),
                age=age,
                income=income,
                credit_score=credit_score,
                employment_status=employment,
                region=fake.state(),
            )
        )
    return customers


def generate_accounts(customers, avg_per_customer=1.6):
    rng = get_rng()
    accounts = []
    for c in customers:
        n_acc = rng.poisson(avg_per_customer) + 1
        for _ in range(n_acc):
            acc_type = rng.choice(["savings", "checking", "credit_card"], p=[0.4, 0.45, 0.15])
            if acc_type == "savings":
                balance = float(np.clip(rng.lognormal(9.0, 1.2), 0, 500_000))
            elif acc_type == "checking":
                balance = float(np.clip(rng.lognormal(8.0, 1.0), 0, 100_000))
            else:
                balance = -float(np.clip(rng.lognormal(7.5, 1.0), 0, 50_000))
            accounts.append(
                Account(
                    customer=c,
                    account_type=acc_type,
                    balance=balance,
                    opened_at=date.today() - timedelta(days=int(rng.integers(30, 3000))),
                )
            )
    return accounts


def generate_loans(customers):
    rng = get_rng()
    loans = []
    for c in customers:
        base_p = 0.35
        if c.credit_score > 720:
            base_p += 0.15
        if c.credit_score < 600:
            base_p -= 0.15
        if c.employment_status == "unemployed":
            base_p -= 0.25
        p = max(0.05, min(0.9, base_p))

        if rng.random() > p:
            continue

        loan_type = rng.choice(["mortgage", "personal", "auto", "business"], p=[0.4, 0.3, 0.2, 0.1])
        if loan_type == "mortgage":
            principal = float(np.clip(rng.lognormal(12.5, 0.6), 50_000, 1_500_000))
            rate = float(rng.normal(0.045, 0.005))
            term = int(rng.choice([180, 240, 360]))
        elif loan_type == "personal":
            principal = float(np.clip(rng.lognormal(9.5, 0.6), 1_000, 50_000))
            rate = float(rng.normal(0.10, 0.02))
            term = int(rng.choice([12, 24, 36, 60]))
        elif loan_type == "auto":
            principal = float(np.clip(rng.lognormal(10.2, 0.4), 5_000, 80_000))
            rate = float(rng.normal(0.06, 0.01))
            term = int(rng.choice([36, 48, 60, 72]))
        else:
            principal = float(np.clip(rng.lognormal(11.5, 0.8), 20_000, 500_000))
            rate = float(rng.normal(0.07, 0.015))
            term = int(rng.choice([24, 36, 60]))

        outstanding = principal * float(rng.uniform(0.3, 0.95))
        status = rng.choice(["current", "delinquent", "default"], p=[0.92, 0.05, 0.03])

        loans.append(
            Loan(
                customer=c,
                principal=principal,
                outstanding=outstanding,
                interest_rate=max(0.005, rate),
                term_months=term,
                loan_type=loan_type,
                status=status,
                region=c.region,
            )
        )
    return loans


def seed_database(db: Session, n_customers: int = 5000):
    logger.info(f"Starting database generation for n_customers={n_customers}...")
    
    # Wipe existing records cleanly
    db.query(Loan).delete()
    db.query(Account).delete()
    db.query(Customer).delete()
    db.commit()

    customers = generate_customers(n_customers)
    db.add_all(customers)
    db.flush()

    accounts = generate_accounts(customers)
    db.add_all(accounts)

    loans = generate_loans(customers)
    db.add_all(loans)

    db.commit()
    
    stats = {
        "customers": len(customers),
        "accounts": len(accounts),
        "loans": len(loans),
    }
    logger.info(f"Database generation complete: {stats}")
    return stats
