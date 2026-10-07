import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import './App.css'; // QUAN TRỌNG: Kéo file CSS vào

// --- TỪ ĐIỂN TÍNH CHẤT CHI TIẾT ---
const SHAPE_PROPERTIES = {
  "Tứ giác lồi": ["Tổng 4 góc trong bằng 360°."],
  "Hình thang": ["Có 2 cạnh đối song song (gọi là hai đáy).", "Tổng 2 góc kề một cạnh bên bằng 180°."],
  "Hình bình hành": ["Các cạnh đối song song và bằng nhau.", "Các góc đối bằng nhau.", "Hai đường chéo cắt nhau tại trung điểm mỗi đường."],
  "Hình chữ nhật": ["Có 4 góc vuông (90°).", "Các cạnh đối song song và bằng nhau.", "Hai đường chéo bằng nhau và cắt nhau tại trung điểm."],
  "Hình thoi": ["Có 4 cạnh bằng nhau.", "Các góc đối bằng nhau.", "Hai đường chéo vuông góc với nhau tại trung điểm.", "Hai đường chéo là các đường phân giác của các góc."],
  "Hình vuông": ["Có 4 góc vuông (90°) và 4 cạnh bằng nhau.", "Hai đường chéo bằng nhau, vuông góc tại trung điểm.", "Hai đường chéo là đường phân giác của các góc.", "Có tâm đối xứng và 4 trục đối xứng."]
};

const SHAPE_FORMULAS = {
  "Tứ giác lồi": {
    perimeter: "P = a + b + c + d",
    area: "\\begin{aligned} S &= \\frac{1}{2} |(x_A - x_C)(y_B - y_D) \\\\ &\\quad - (x_B - x_D)(y_A - y_C)| \\end{aligned}"
  },
  "Hình thang": { perimeter: "P = a + b + c + d", area: "S = \\frac{(a + b) \\times h}{2}" },
  "Hình bình hành": { perimeter: "P = 2(a + b)", area: "S = a \\times h" },
  "Hình chữ nhật": { perimeter: "P = 2(a + b)", area: "S = a \\times b" },
  "Hình thoi": { perimeter: "P = 4a", area: "S = \\frac{1}{2} (d_1 \\times d_2)" },
  "Hình vuông": { perimeter: "P = 4a", area: "S = a^2" }
};

const SHAPES_LIST = ["Hình thang", "Hình bình hành", "Hình chữ nhật", "Hình thoi", "Hình vuông"];

const getDistance = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
const getMidpoint = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });

const areParallel = (p1, p2, p3, p4) => {
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const len1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const len2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (len1 === 0 || len2 === 0) return false;
  const cross = Math.abs((v1.x * v2.y - v1.y * v2.x) / (len1 * len2));
  return cross < 0.08; 
};

const getAngle = (p1, p2, p3) => {
  const a = getDistance(p2, p3);
  const b = getDistance(p1, p2);
  const c = getDistance(p1, p3);
  const radian = Math.acos((a*a + b*b - c*c) / (2 * a * b));
  return (radian * 180 / Math.PI);
};

const getArea = (pts) => {
  let area = 0;
  for (let i = 0; i < 4; i++) {
    let j = (i + 1) % 4;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area / 2);
};

const isClose = (a, b) => Math.abs(a - b) < 15;

function App() {
  const [shapes, setShapes] = useState([]);
  const [error, setError] = useState(null);
  const [detectedShape, setDetectedShape] = useState("Tứ giác lồi");
  const [challenge, setChallenge] = useState("Hình bình hành");
  const [isSuccess, setIsSuccess] = useState(false);

  const [points, setPoints] = useState([
    { id: 'A', x: 150, y: 100 },
    { id: 'B', x: 450, y: 100 },
    { id: 'C', x: 400, y: 300 },
    { id: 'D', x: 100, y: 300 },
  ]);

  const nameOffsets = [{ x: -25, y: -25 }, { x: 15, y: -25 }, { x: 15, y: 15 }, { x: -25, y: 15 }];
  const angleOffsets = [{ x: 15, y: 10 }, { x: -45, y: 10 }, { x: -45, y: -25 }, { x: 15, y: -25 }];

  useEffect(() => {
    fetch('https://geoquad-neo4j.onrender.com/api/shapes')
      .then((response) => response.json())
      .then((data) => setShapes(data))
      .catch((err) => setError(err.message));
    checkShape(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkShape = (pts) => {
    const [A, B, C, D] = pts;
    const AB = getDistance(A, B), BC = getDistance(B, C), CD = getDistance(C, D), DA = getDistance(D, A);
    const AC = getDistance(A, C), BD = getDistance(B, D);

    const isParallelogram = isClose(AB, CD) && isClose(BC, DA);
    const isRhombus = isParallelogram && isClose(AB, BC);
    const isRectangle = isParallelogram && isClose(AC, BD); 
    const isSquare = isRhombus && isRectangle;
    const isTrapezoid = areParallel(A, B, C, D) || areParallel(A, D, B, C);

    let currentShape = "Tứ giác lồi";
    if (isSquare) currentShape = "Hình vuông";
    else if (isRectangle) currentShape = "Hình chữ nhật";
    else if (isRhombus) currentShape = "Hình thoi";
    else if (isParallelogram) currentShape = "Hình bình hành";
    else if (isTrapezoid) currentShape = "Hình thang";

    setDetectedShape(currentShape);
    setIsSuccess(currentShape === challenge);
  };

  const handleDragMove = (e, index) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], x: e.target.x(), y: e.target.y() };
    setPoints(newPoints);
    checkShape(newPoints); 
  };

  const generateNewChallenge = () => {
    setChallenge(SHAPES_LIST[Math.floor(Math.random() * SHAPES_LIST.length)]);
    setIsSuccess(false);
  };

  const flattenedPoints = points.flatMap((p) => [p.x, p.y]);
  const [A, B, C, D] = points;
  const midAB = getMidpoint(A, B), midBC = getMidpoint(B, C), midCD = getMidpoint(C, D), midDA = getMidpoint(D, A);
  
  const angleA = getAngle(D, A, B), angleB = getAngle(A, B, C), angleC = getAngle(B, C, D), angleD = getAngle(C, D, A);
  const perimeter = getDistance(A, B) + getDistance(B, C) + getDistance(C, D) + getDistance(D, A);
  const area = getArea(points);

  return (
    <div className="app-container">
      
      {/* CỘT TRÁI: Bảng vẽ & Minigame */}
      <div className="left-column">
        <div className="header-mobile">
          <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Bảng vẽ GeoQuad</h1>
          <button 
            onClick={generateNewChallenge}
            style={{ padding: '10px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Đổi bài tập
          </button>
        </div>

        <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '15px', backgroundColor: isSuccess ? '#d5f5e3' : '#fcf3cf', border: `2px solid ${isSuccess ? '#2ecc71' : '#f1c40f'}`, transition: 'all 0.3s ease' }}>
          <h3 style={{ margin: 0, color: isSuccess ? '#27ae60' : '#d35400' }}>
            🎮 Thử thách: Kéo các đỉnh để tạo thành <strong>{challenge}</strong>
          </h3>
          {isSuccess && <p style={{ margin: '10px 0 0 0', color: '#27ae60', fontWeight: 'bold' }}>🎉 Tuyệt vời! Bạn đã vẽ chính xác {challenge}!</p>}
        </div>

        {/* Khung chứa bảng vẽ linh hoạt có thanh cuộn ngang */}
        <div className="canvas-wrapper">
          <Stage width={800} height={450}>
            <Layer>
              <Line points={flattenedPoints} closed stroke={isSuccess ? "#27ae60" : "#3498db"} strokeWidth={4} fill={isSuccess ? "rgba(46, 204, 113, 0.2)" : "rgba(52, 152, 219, 0.2)"} />
              <Line points={[points[0].x, points[0].y, points[2].x, points[2].y]} stroke="#bdc3c7" strokeWidth={1} dash={[5, 5]} />
              <Line points={[points[1].x, points[1].y, points[3].x, points[3].y]} stroke="#bdc3c7" strokeWidth={1} dash={[5, 5]} />

              <Text x={midAB.x - 15} y={midAB.y - 20} text={Math.round(getDistance(A, B))} fontSize={16} fill="#e67e22" fontStyle="bold" />
              <Text x={midBC.x + 10} y={midBC.y - 10} text={Math.round(getDistance(B, C))} fontSize={16} fill="#e67e22" fontStyle="bold" />
              <Text x={midCD.x - 15} y={midCD.y + 10} text={Math.round(getDistance(C, D))} fontSize={16} fill="#e67e22" fontStyle="bold" />
              <Text x={midDA.x - 30} y={midDA.y - 10} text={Math.round(getDistance(D, A))} fontSize={16} fill="#e67e22" fontStyle="bold" />

              <Text x={A.x + angleOffsets[0].x} y={A.y + angleOffsets[0].y} text={`${angleA.toFixed(0)}°`} fontSize={14} fill="#c0392b" fontStyle="bold" />
              <Text x={B.x + angleOffsets[1].x} y={B.y + angleOffsets[1].y} text={`${angleB.toFixed(0)}°`} fontSize={14} fill="#c0392b" fontStyle="bold" />
              <Text x={C.x + angleOffsets[2].x} y={C.y + angleOffsets[2].y} text={`${angleC.toFixed(0)}°`} fontSize={14} fill="#c0392b" fontStyle="bold" />
              <Text x={D.x + angleOffsets[3].x} y={D.y + angleOffsets[3].y} text={`${angleD.toFixed(0)}°`} fontSize={14} fill="#c0392b" fontStyle="bold" />

              {points.map((point, index) => (
                <React.Fragment key={point.id}>
                  <Circle
                    x={point.x} y={point.y} radius={10} fill={isSuccess ? "#27ae60" : "#e74c3c"} draggable
                    onDragMove={(e) => handleDragMove(e, index)}
                    onMouseEnter={(e) => e.target.getStage().container().style.cursor = 'grab'}
                    onMouseLeave={(e) => e.target.getStage().container().style.cursor = 'default'}
                  />
                  <Text x={point.x + nameOffsets[index].x} y={point.y + nameOffsets[index].y} text={point.id} fontSize={22} fontStyle="bold" fill="#2c3e50" />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* CỘT PHẢI: Kết quả nhận diện, Toán học & Lý thuyết */}
      <div className="right-column">
        <h2 style={{ color: detectedShape === challenge ? '#27ae60' : '#e74c3c', marginTop: 0, borderBottom: '2px solid #ecf0f1', paddingBottom: '15px' }}>
          Đang vẽ: {detectedShape}
        </h2>

        <div style={{ backgroundColor: '#f4f6f7', padding: '15px', borderRadius: '8px', marginBottom: '20px', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📐 Công thức Toán học:</h4>
          
          <BlockMath math={`\\angle A + \\angle B + \\angle C + \\angle D = 360^\\circ`} />
          <div style={{ fontSize: '13px', textAlign: 'center', color: '#7f8c8d', marginBottom: '15px' }}>
            (Kiểm chứng: {angleA.toFixed(0)}° + {angleB.toFixed(0)}° + {angleC.toFixed(0)}° + {angleD.toFixed(0)}° = 360°)
          </div>

          <BlockMath math={SHAPE_FORMULAS[detectedShape].perimeter} />
          <div style={{ fontSize: '13px', textAlign: 'center', color: '#7f8c8d', marginBottom: '15px' }}>
            (Thực tế đo: P = {perimeter.toFixed(1)} px)
          </div>

          <BlockMath math={SHAPE_FORMULAS[detectedShape].area} />
          <div style={{ fontSize: '13px', textAlign: 'center', color: '#7f8c8d' }}>
            (Thực tế đo: S = {area.toFixed(1)} px²)
          </div>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2980b9' }}>Tính chất {detectedShape}:</h3>
          <ul style={{ lineHeight: '1.8', fontSize: '15px', color: '#34495e', paddingLeft: '20px' }}>
            {SHAPE_PROPERTIES[detectedShape].map((prop, idx) => (
              <li key={idx}>{prop}</li>
            ))}
          </ul>
        </div>

        <h3 style={{ color: '#2c3e50', borderTop: '2px solid #ecf0f1', paddingTop: '20px' }}>
          Cơ sở dữ liệu Neo4j:
        </h3>
        {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
        <ul style={{ fontSize: '14px', color: '#7f8c8d', paddingLeft: 0, listStyle: 'none' }}>
          {shapes.map((shape, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <span style={{ 
                fontWeight: shape.name === detectedShape ? 'bold' : 'normal',
                color: shape.name === detectedShape ? '#fff' : '#2c3e50',
                backgroundColor: shape.name === detectedShape ? '#3498db' : '#ecf0f1',
                padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px'
              }}>
                {shape.name}
              </span> 
              {shape.definition && <div style={{marginLeft: '10px'}}>{shape.definition}</div>}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;