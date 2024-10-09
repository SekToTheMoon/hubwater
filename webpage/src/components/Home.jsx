import React from "react";
import useAuth from "../hooks/useAuth";

function Home() {
  const { auth } = useAuth();
  return (
    <>
      <div className="bg-base-200 h-full p-7">
        <div className="h-full flex flex-col items-center space-y-10 max-w-3xl mx-auto  md:flex-row-reverse">
          <div className="max-w-96">
            <img
              src={`http://hubwater-production-7ee5.up.railway.app/img/avatar/${auth.employee_img}`}
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
          <div className="p-3">
            <h1 className="text-5xl font-bold">ยินดีต้อนรับ</h1>
            <p className="py-6">
              <span className="text-xl">
                {auth.employee_fname + " " + auth.employee_lname}
              </span>
              <br />
              กังวลให้น้อยลง ยิ้มให้มากขึ้น ยิ่งแคร์น้อยลงเท่าไหร่
              เราก็จะยิ่งมีความสุขมากขึ้นเท่านั้น
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
