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
    echo "  [3] Seed Database  (Create sample data)"
    echo "  [4] Query Tool     (Query database)"
    echo "  [5] Test AI        (Test AI chatbot)"
    echo "  [6] Start Prod     (docker-compose up -d)"
    echo "  [7] View Logs"
    echo "  [8] Stop All       (docker-compose down)"
    echo "  [9] Exit"
    echo ""
}

start_docker() {
    local profile=$1
    
    # Load .env into shell for docker-compose variable expansion
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    echo ""
    echo "[Docker] Starting SEN Backend: $profile"
    echo ""
    
    case $profile in
        build)
            echo "[Docker] Building development images..."
            docker-compose -f $DOCKER_DEV --profile dev build
            echo ""
            echo "[Docker] Building production images..."
            docker-compose -f $DOCKER_PROD build
            echo ""
            echo "[OK] All images built successfully"
            ;;
        dev)
            docker-compose -f $DOCKER_DEV --profile dev up
            ;;
        seed|query|test-ai)
            docker-compose -f $DOCKER_DEV --profile $profile run --rm sen-backend-$profile
            ;;
        prod)
            docker-compose -f $DOCKER_PROD up -d
            echo ""
            echo "[OK] Production server running at http://localhost:3000"
            ;;
        logs)
            # Check for any sen-backend containers
            CONTAINERS=$(docker ps --filter "name=sen-backend" --format "{{.Names}}" 2>/dev/null)
            
            if [ -n "$CONTAINERS" ]; then
                echo "[Info] Found running containers: $CONTAINERS"
                echo ""
                docker logs -f $(echo $CONTAINERS | head -1)
            else
                echo "[Info] No running containers found. Start a server first."
            fi
            ;;
        down)
            docker-compose -f $DOCKER_DEV --profile dev down 2>/dev/null
            docker-compose -f $DOCKER_PROD down 2>/dev/null
            echo "[OK] All containers stopped"
            ;;
    esac
}

# If argument provided
if [ $# -gt 0 ]; then
    case $1 in
        build|dev|seed|query|test-ai|prod|logs|down)
            start_docker $1
            exit 0
            ;;
        help)
            echo ""
            echo "Usage: bash run.sh [mode]"
            echo ""
            echo "Available modes:"
            echo "  build    - Build Docker images (first time / rebuild)"
            echo "  dev      - Start development server (hot-reload)"
            echo "  seed     - Run database seeding"
            echo "  query    - Run query tool"
            echo "  test-ai  - Test AI chatbot"
            echo "  prod     - Start production server"
            echo "  logs     - View container logs"
            echo "  down     - Stop all containers"
            echo ""
            echo "First time setup:"
            echo "  bash run.sh build"
            echo "  bash run.sh dev"
            echo ""
            exit 0
            ;;
        *)
            echo "[Error] Invalid mode: $1"
            echo "Run 'bash run.sh help' for usage"
            exit 1
            ;;
    esac
fi

# Interactive menu
while true; do
    show_menu
    read -p "Select [1-9]: " choice
    
    case $choice in
        1) start_docker "build" ;;
        2) start_docker "dev"; break ;;
        3) start_docker "seed"; break ;;
        4) start_docker "query"; break ;;
        5) start_docker "test-ai"; break ;;
        6) start_docker "prod"; break ;;
        7) start_docker "logs" ;;
        8) start_docker "down" ;;
        9) 
            echo ""
            echo "Goodbye!"
            echo ""
            exit 0
            ;;
        *)
            echo ""
            echo "[Error] Invalid choice!"
            sleep 1
            ;;
    esac
    
    # Wait before showing menu again
    if [ "$choice" != "9" ]; then
        echo ""
        read -p "Press Enter to continue..."
    fi
done
