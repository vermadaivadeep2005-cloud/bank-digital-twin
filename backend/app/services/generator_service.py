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


def import_csv_bank_data(db: Session, csv_content: str):
    """
    Parses user-uploaded CSV containing real bank customers and loan portfolios.
    Wipes existing portfolio and seeds database from CSV rows.
    """
    import csv
    import io

    reader = csv.DictReader(io.StringIO(csv_content.strip()))
    
    # Wipe existing records cleanly
    db.query(Loan).delete()
    db.query(Account).delete()
    db.query(Customer).delete()
    db.commit()

    customers = []
    accounts = []
    loans = []

    CURRENCY_TO_USD_RATES = {
        "USD": 1.0,
        "INR": 1.0 / 84.50,
        "EUR": 1.0 / 0.92,
        "GBP": 1.0 / 0.78,
        "RS": 1.0 / 84.50,
        "RUPEES": 1.0 / 84.50,
    }

    for row in reader:
        # Normalize keys
        clean_row = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k is not None}
        
        # Determine currency rate conversion
        curr_code = clean_row.get("currency", "USD").upper().strip()
        curr_rate = CURRENCY_TO_USD_RATES.get(curr_code, 1.0)
        
        name = clean_row.get("name") or clean_row.get("customer_name") or fake.name()
        try:
            cs = int(float(clean_row.get("credit_score", 700)))
        except (ValueError, TypeError):
            cs = 700
        cs = max(300, min(850, cs))

        try:
            raw_income = float(clean_row.get("income", 75000))
        except (ValueError, TypeError):
            raw_income = 75000.0
        income = raw_income * curr_rate

        try:
            age = int(float(clean_row.get("age", 40)))
        except (ValueError, TypeError):
            age = 40

        emp = clean_row.get("employment_status", "employed").lower()
        if emp not in ["employed", "self-employed", "unemployed", "retired"]:
            emp = "employed"

        region = clean_row.get("region") or clean_row.get("state") or fake.state()

        c = Customer(
            name=name,
            age=age,
            income=income,
            credit_score=cs,
            employment_status=emp,
            region=region,
        )
        customers.append(c)

        # Generate checking/savings account
        acc_bal = max(1000.0, income * 0.15)
        accounts.append(Account(customer=c, account_type="checking", balance=acc_bal))

        # Parse loan details
        try:
            raw_principal = float(clean_row.get("principal", 250000))
        except (ValueError, TypeError):
            raw_principal = 250000.0
        principal = raw_principal * curr_rate

        try:
            raw_outstanding = float(clean_row.get("outstanding", raw_principal * 0.75))
        except (ValueError, TypeError):
            raw_outstanding = raw_principal * 0.75
        outstanding = raw_outstanding * curr_rate

        try:
            rate_val = float(clean_row.get("interest_rate", 0.055))
            if rate_val > 1.0:
                rate_val = rate_val / 100.0
        except (ValueError, TypeError):
            rate_val = 0.055

        loan_type = clean_row.get("loan_type", "mortgage").lower()
        if loan_type not in ["mortgage", "personal", "auto", "business"]:
            loan_type = "mortgage"

        # Determine loan status (use explicit status if provided, or infer from credit score)
        raw_status = clean_row.get("status", "").lower()
        if raw_status in ["current", "delinquent", "default"]:
            status = raw_status
        else:
            if cs < 610:
                status = "default"
            elif cs < 660:
                status = "delinquent"
            else:
                status = "current"

        loans.append(
            Loan(
                customer=c,
                principal=principal,
                outstanding=outstanding,
                interest_rate=rate_val,
                term_months=360 if loan_type == "mortgage" else 60,
                loan_type=loan_type,
                status=status,
                region=region,
            )
        )

    if not customers:
        raise ValueError("No valid customer or loan records found in CSV file.")

    db.add_all(customers)
    db.flush()
    db.add_all(accounts)
    db.add_all(loans)
    db.commit()

    stats = {
        "customers": len(customers),
        "accounts": len(accounts),
        "loans": len(loans),
    }
    logger.info(f"CSV Import complete: {stats}")
    return stats
