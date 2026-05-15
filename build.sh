set -e

echo "--- Bắt đầu quá trình cập nhật và triển khai ---"

echo "[1/2] Đang thực hiện git pull..."
git pull

echo "[2/2] Đang thực hiện docker compose up -d --build..."
docker compose up -d --build

echo "--- Quá trình hoàn tất thành công! ---"
"""