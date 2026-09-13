# from fastapi import FastAPI, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker, Session
# import datetime

# # 1. PostgreSQL ഡാറ്റാബേസ് കണക്ഷൻ URL
# # നിങ്ങളുെട postgres username, password, host, database name എന്നിവ അനുയോജ്യമായി മാറ്റുക
# DATABASE_URL = "postgresql://postgres:444909@localhost:5432/agri_ai_db"

# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# # 2. Database Model (PostgreSQL ടേബിൾ സ്ട്രക്ചർ)
# class AdvisoryTable(Base):
#     __tablename__ = "advisories"

#     id = Column(Integer, primary_key=True, index=True)
#     farmer_name = Column(String(100), nullable=False)
#     location = Column(String(100), nullable=False)
#     crop = Column(String(100), nullable=False)
#     query = Column(Text, nullable=False)
#     created_at = Column(DateTime, default=datetime.datetime.utcnow)

# # ടേബിൾ ഡാറ്റാബേസിൽ ക്രിയേറ്റ് ചെയ്യുന്നു
# Base.metadata.create_all(bind=engine)

# # FastAPI App Initialize ചെയ്യുന്നു
# app = FastAPI()

# # Frontend-ൽ നിന്ന് Request സ്വീകരിക്കാൻ CORS എനേബിൾ ചെയ്യുന്നു
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Database Session ലഭിക്കാനുള്ള Helper ഫംഗ്ഷൻ
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # Request Body validation (Pydantic Schema)
# class AdvisoryRequest(BaseModel):
#     farmerName: str
#     location: str
#     crop: str
#     query: str

# # 3. API Route - ചോദ്യങ്ങളും ഡാറ്റയും സ്വീകരിച്ച് DB-യിലേക്ക് സേവ് ചെയ്യാൻ
# @app.post("/api/ask-advisor")
# def ask_advisor(data: AdvisoryRequest, db: Session = Depends(get_db)):
#     try:
#         # ഡാറ്റാബേസിലേക്ക് ഒബ്ജക്റ്റ് ഉണ്ടാക്കുന്നു
#         new_entry = AdvisoryTable(
#             farmer_name=data.farmerName,
#             location=data.location,
#             crop=data.crop,
#             query=data.query
#         )
        
#         # PostgreSQL-ലേക്ക് സേവ് ചെയ്യുന്നു
#         db.add(new_entry)
#         db.commit()
#         db.refresh(new_entry)

#         # simulated AI Response (ഇവിടെ ഭാവിയിൽ OpenAI / Gemini പോലുള്ള API വഴി യഥാർത്ഥ AI ചേർക്കാം)
#         ai_advice = f"ഹലോ {data.farmerName}, {data.location} പ്രദേശത്തെ {data.crop} കൃഷിയുമായി ബന്ധപ്പെട്ട് കാലാവസ്ഥ അനുയോജ്യമാണ്. വിപണിയിൽ ഇപ്പോൾ നല്ല ഡിമാൻഡ് ഉണ്ട്."

#         return {
#             "success": True,
#             "message": "വിവരങ്ങൾ വിജയകരമായി PostgreSQL ഡാറ്റാബേസിൽ സേവ് ചെയ്തു!",
#             "advice": ai_advice
#         }
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))



#     #0000000000000000000000000
#     

