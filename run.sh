#!/bin/bash
# ============================================
# SEN Backend - Docker Run Script
# ============================================

DOCKER_DEV="Docker/Dev/docker-compose.yml"
DOCKER_PROD="Docker/Production/docker-compose.yml"

show_menu() {
    echo ""
    echo "=========================================="
    echo "     SEN Backend - Docker Runner"
    echo "=========================================="
    echo ""
    echo "  Select mode:"
    echo ""
    echo "  [1] Build Images   (First time / Rebuild only)"
    echo "  [2] Start Dev      (docker-compose up)"
    echo "  [3] Seed Database  (Create FULL sample data)"
    echo "  [4] Reset Game     (Clear User Progress)"
    echo "  [5] Query Tool     (Query database)"
    echo "  [6] Test AI        (Test AI chatbot)"
    echo "  [7] Start Prod     (docker-compose up -d)"
    echo "  [8] View Logs"
    echo "  [9] Stop All      (docker-compose down)"
    echo "  [10] Exit"
    echo ""
}

# Helper to run command inside the active container
run_exec() {
    local cmd=$1
    local description=$2
    local should_restart=$3
    
    # Check for Prod then Dev
    if docker ps --format '{{.Names}}' | grep -q "^sen-backend$"; then
        TARGET="sen-backend"
    elif docker ps --format '{{.Names}}' | grep -q "^sen-backend-dev$"; then
        TARGET="sen-backend-dev"
    else
        echo ""
        echo "[Error] Backend Server is NOT running."
        echo "Please start the server first (Select [2] Dev or [8] Prod)."
        echo ""
        return
    fi

    echo ""
    echo "[Info] Executing: $description"
    echo "[Container] $TARGET"
    echo "---------------------------------------------------"
    docker exec -it $TARGET $cmd
    EXIT_CODE=$?
    echo "---------------------------------------------------"

    if [ $EXIT_CODE -eq 0 ] && [ "$should_restart" == "true" ]; then
        echo "[Info] Restarting server to apply changes..."
        docker restart $TARGET
        echo "[OK] Server restarted successfully."
    fi
}

start_docker() {
    local profile=$1
    
    # Load .env variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    echo ""
    echo "[Docker] Action: $profile"
    
    case $profile in
        build)
            echo "[Docker] Building development images..."
            docker-compose -f $DOCKER_DEV --profile dev build
            echo ""
            echo "[Docker] Building production images..."
            docker-compose -f $DOCKER_PROD build
            echo "[OK] All images built successfully"
            ;;
        dev)
            docker-compose -f $DOCKER_DEV --profile dev up
            ;;
        seed)
            run_exec "npm run seed" "Full Database Seeding" "true"
            ;;
        reset)
            run_exec "node scripts/reset_game.js" "Reset User Progress" "true"
            ;;
        query)
            run_exec "npm run query" "Database Query Tool" "false"
            ;;
        test-ai)
            run_exec "npm run test-ai" "AI Chatbot Test" "false"
            ;;
        prod)
            docker-compose -f $DOCKER_PROD up -d
            echo ""
            echo "[OK] Production server running at http://localhost:3000"
            ;;
        logs)
            CONTAINERS=$(docker ps --filter "name=sen-backend" --format "{{.Names}}" 2>/dev/null)
            if [ -n "$CONTAINERS" ]; then
                echo "[Info] Found: $CONTAINERS"
                docker logs -f $(echo $CONTAINERS | head -1)
            else
                echo "[Info] No running containers found."
            fi
            ;;
        down)
            docker-compose -f $DOCKER_DEV --profile dev down 2>/dev/null
            docker-compose -f $DOCKER_PROD down 2>/dev/null
            echo "[OK] All containers stopped"
            ;;
    esac
}

# CLI Argument Handler
if [ $# -gt 0 ]; then
    case $1 in
        build|dev|prod|logs|down) start_docker $1; exit 0 ;;
        seed) start_docker "seed"; exit 0 ;;
        reset) start_docker "reset"; exit 0 ;;
        query) start_docker "query"; exit 0 ;;
        test-ai) start_docker "test-ai"; exit 0 ;;
        help)
            echo "Usage: bash run.sh [mode]"
            exit 0
            ;;
        *)
            echo "[Error] Invalid mode: $1"
            exit 1
            ;;
    esac
fi

# Interactive Menu
while true; do
    show_menu
    read -p "Select [1-11]: " choice
    
    case $choice in
        1) start_docker "build" ;;
        2) start_docker "dev"; break ;;
        3) start_docker "seed" ;;
        4) start_docker "reset" ;;
        5) start_docker "query" ;;
        6) start_docker "test-ai" ;;
        7) start_docker "prod"; break ;;
        8) start_docker "logs" ;;
        9) start_docker "down" ;;
        10) echo "Goodbye!"; exit 0 ;;
        *) echo "[Error] Invalid choice!"; sleep 1 ;;
    esac
    
    if [ "$choice" != "10" ]; then
        echo ""
        read -p "Press Enter to continue..."
    fi
done
