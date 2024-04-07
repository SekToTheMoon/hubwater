import React from "react";

function Home() {
  return (
    <>
      <div className="hero min-h-screen bg-base-200 rounded-box">
        <div className="hero-content flex-col lg:flex-row">
          <img
            src="https://daisyui.com/images/stock/photo-1635805737707-575885ab0820.jpg"
            className="max-w-sm rounded-lg shadow-2xl"
          />
          <div>
            <h1 className="text-5xl font-bold">ยินดีต้นรับสู่หน้าแรก</h1>
            <p className="py-6">
              เมื่อเราเห็นพระอาทิตย์ขึ้นในยามเช้า เป็นสัญญาณบอกให้รู้ว่าสิ่งใหม่
              ๆ ของวันใหม่กำลังเริ่มต้นแล้วนะ ขอให้ทำงานอย่างมีความสุข 555
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
