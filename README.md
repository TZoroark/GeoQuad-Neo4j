# Hướng dẫn sử dụng GeoQuad (Tứ giác Interactive)

## 1. Yêu cầu hệ thống
* Node.js (v16 trở lên)
* Neo4j Desktop (hoặc tài khoản Neo4j AuraDB)

## 2. Cài đặt Cơ sở dữ liệu (Neo4j)
1. Khởi động Neo4j.
2. Mở Neo4j Browser, copy toàn bộ nội dung trong file `database/init_db.cypher` và chạy để tạo cơ sở tri thức hình học.

## 3. Khởi chạy Backend
1. Mở terminal, truy cập thư mục `backend/`.
2. Chạy lệnh: `npm install`
3. Tạo file `.env` chứa thông tin kết nối Neo4j (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD).
4. Chạy server: `npm start` (Server lắng nghe ở cổng 5000).

## 4. Khởi chạy Frontend
1. Mở terminal, truy cập thư mục `frontend/`.
2. Chạy lệnh: `npm install`
3. Chạy giao diện: `npm start` (Truy cập tại http://localhost:3000).

## 5. Thao tác trên ứng dụng
* **Vẽ hình:** Click vào vùng Canvas trống để thả 4 điểm tọa độ tạo thành 1 tứ giác.
* **Kéo thả:** Dùng chuột kéo các đỉnh, hệ thống sẽ tự động đo góc, độ dài và hiển thị tên hình tương ứng nếu thỏa mãn điều kiện (VD: Hình bình hành).
* **Tra cứu:** Bấm vào nút "Cây phả hệ" để xem sơ đồ chuyển hóa các dạng tứ giác lấy trực tiếp từ đồ thị Neo4j.