@echo off
REM Create main project directory structure
mkdir src
cd src

REM Create service directories and their subdirectories
for %%s in (user_service prize_center_service raffle_service promotions_service analysis_service) do (
    mkdir %%s
    mkdir %%s\models
    mkdir %%s\routes
    mkdir %%s\schemas
    mkdir %%s\services
    type nul > %%s\__init__.py
)

REM Create shared directory and its files
mkdir shared
type nul > shared\__init__.py
type nul > shared\config.py
type nul > shared\database.py
type nul > shared\auth.py

cd ..

REM Create other main directories
mkdir tests
mkdir migrations
mkdir config
mkdir logs

REM Create test directories
cd tests
type nul > conftest.py
mkdir user_service
mkdir prize_center_service
mkdir raffle_service
cd ..

REM Create config files
cd config
type nul > development.py
type nul > production.py
type nul > testing.py
cd ..

REM Create root level files
type nul > .env
type nul > .gitignore
type nul > README.md
type nul > app.py
type nul > wsgi.py

echo Setup completed successfully!