import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';

// --- CÁC HÀM TOÁN HỌC TRỢ GIÚP ---

// 1. Tính độ dài đoạn thẳng giữa 2 điểm
const getDistance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

// 2. Kiểm tra 2 đoạn thẳng có song song không (dùng Vector - Tích có hướng)
const areParallel = (p1, p2, p3, p4) => {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const len1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const len2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (len1 === 0 || len2 === 0) return false;
  
  // Trị tuyệt đối của sin góc giữa 2 vector. Nếu gần bằng 0 -> song song
  const cross = Math.abs((v1.x * v2.y - v1.y * v2.x) / (len1 * len2));
  return cross < 0.08; // Dung sai khoảng 4.5 độ để người dùng dễ kéo
};

// 3. So sánh 2 độ dài có bằng nhau không (Dung sai 15 pixel)
const isClose = (a, b) => Math.abs(a - b) < 15;

function App() {
  const [shapes, setShapes] = useState([]);
  const [error, setError] = useState(null);
  const [detectedShape, setDetectedShape] = useState("Tứ giác lồi");

  const [points, setPoints] = useState([
    { id: 'A', x: 150, y: 100 },
    { id: 'B', x: 450, y: 100 },
    { id: 'C', x: 400, y: 300 },
    { id: 'D', x: 100, y: 300 },
  ]);

  useEffect(() => {
    fetch('http://localhost:5000/api/shapes')
      .then((response) => response.json())
      .then((data) => setShapes(data))
      .catch((err) => setError(err.message));
      
    // Nhận diện hình mặc định khi vừa mở app
    checkShape(points);
  }, []);

  // --- THUẬT TOÁN NHẬN DIỆN HÌNH ---
  const checkShape = (pts) => {
    const [A, B, C, D] = pts;

    // Tính độ dài 4 cạnh
    const AB = getDistance(A, B);
    const BC = getDistance(B, C);
    const CD = getDistance(C, D);
    const DA = getDistance(D, A);

    // Tính 2 đường chéo
    const AC = getDistance(A, C);
    const BD = getDistance(B, D);

    // Kiểm tra song song
    const isAB_CD_Parallel = areParallel(A, B, C, D);
    const isAD_BC_Parallel = areParallel(A, D, B, C);

    // Logic định nghĩa các hình
    const isParallelogram = isClose(AB, CD) && isClose(BC, DA);
    const isRhombus = isParallelogram && isClose(AB, BC);
    const isRectangle = isParallelogram && isClose(AC, BD); // HBH có 2 đường chéo bằng nhau
    const isSquare = isRhombus && isRectangle;
    const isTrapezoid = isAB_CD_Parallel || isAD_BC_Parallel;

    // Cập nhật kết quả (Ưu tiên hình cấp cao nhất)
    if (isSquare) setDetectedShape("Hình vuông");
    else if (isRectangle) setDetectedShape("Hình chữ nhật");
    else if (isRhombus) setDetectedShape("Hình thoi");
    else if (isParallelogram) setDetectedShape("Hình bình hành");
    else if (isTrapezoid) setDetectedShape("Hình thang");
    else setDetectedShape("Tứ giác lồi");
  };

  const handleDragMove = (e, index) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], x: e.target.x(), y: e.target.y() };
    setPoints(newPoints);
    checkShape(newPoints); // Gọi hàm nhận diện ngay khi đang kéo chuột
  };

  const flattenedPoints = points.flatMap((p) => [p.x, p.y]);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', display: 'flex', gap: '40px' }}>
      
      {/* CỘT TRÁI: Bảng vẽ */}
      <div>
        <h1 style={{ color: '#2c3e50' }}>Bảng vẽ GeoQuad</h1>
        
        {/* HIỂN THỊ KẾT QUẢ NHẬN DIỆN */}
        <h2 style={{ color: '#e74c3c', marginTop: 0 }}>
          Hệ thống nhận diện: {detectedShape}
        </h2>
        
        <p><i>Kéo các đỉnh (A, B, C, D) để cố gắng tạo thành Hình chữ nhật hoặc Hình bình hành nhé!</i></p>
        
        <div style={{ border: '2px solid #ccc', backgroundColor: '#f9f9f9', width: '600px', height: '400px' }}>
          <Stage width={600} height={400}>
            <Layer>
              <Line points={flattenedPoints} closed stroke="#3498db" strokeWidth={4} fill="rgba(52, 152, 219, 0.2)" />

              {/* Vẽ đường chéo đứt nét để dễ căn góc */}
              <Line points={[points[0].x, points[0].y, points[2].x, points[2].y]} stroke="#95a5a6" strokeWidth={1} dash={[5, 5]} />
              <Line points={[points[1].x, points[1].y, points[3].x, points[3].y]} stroke="#95a5a6" strokeWidth={1} dash={[5, 5]} />

              {points.map((point, index) => (
                <React.Fragment key={point.id}>
                  <Circle
                    x={point.x} y={point.y} radius={8} fill="#e74c3c" draggable
                    onDragMove={(e) => handleDragMove(e, index)}
                    onMouseEnter={(e) => e.target.getStage().container().style.cursor = 'grab'}
                    onMouseLeave={(e) => e.target.getStage().container().style.cursor = 'default'}
                  />
                  <Text x={point.x + 12} y={point.y - 15} text={point.id} fontSize={20} fontStyle="bold" fill="#2c3e50" />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* CỘT PHẢI: Lý thuyết */}
      <div style={{ flex: 1 }}>
        <h2 style={{ color: '#2c3e50' }}>Lý thuyết (Neo4j):</h2>
        {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
        <ul>
          {shapes.map((shape, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong style={{ color: shape.name === detectedShape ? '#27ae60' : '#000' }}>
                {shape.name}
              </strong> 
              {shape.definition && <span> - {shape.definition}</span>}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;