set -e

echo "--- Bắt đầu quá trình cập nhật và triển khai ---"

echo "[1/3] Đang thực hiện git pull..."
git pull

echo "[2/3] Đang thực hiện update"
npm i -f

echo "[2/3] Đang thực hiện docker compose up -d --build..."
docker compose up -d --build

echo "--- Quá trình hoàn tất thành công! ---"
