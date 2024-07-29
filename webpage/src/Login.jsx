import React, { useEffect, useState } from "react";
import axios from "./api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {
    try {
      const response = await axios.post("/login", {
        username: username,
        password: password,
      });

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("employee_id", response.data.employee_id);
        localStorage.setItem("employee_fname", response.data.employee_fname);
        localStorage.setItem("employee_lname", response.data.employee_lname);
        localStorage.setItem("employee_img", response.data.employee_img);
        localStorage.setItem(
          "posit_permission",
          response.data.posit_permission
        );
        localStorage.setItem("posit_name", response.data.posit_name);

        window.location = "/all/home";
      } else {
        console.error("Login failed");
      }
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  return (
    <div>
      <main className="artboard flex justify-center h-screen">
        <div
          className="hero min-h-screen "
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?cs=srgb&dl=pexels-matt-hardy-1533720.jpg&fm=jpg)",
          }}
        >
          <div className="hero-content flex-col w-2/3 md:w-1/2 xl:w-1/3">
            <div className="text-center mb-2 ">
              <h1 className="text-3xl font-bold opacity-75">
                ระบบร้านขายเครื่องกรองน้ำ
              </h1>
            </div>
            <div className="card shrink-0 w-full  shadow-2xl bg-base-100">
              <form className="card-body" onSubmit={(e) => e.preventDefault()}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">ชื่อบัญชี</span>
                  </label>
                  <input
                    type="text"
                    placeholder=""
                    className="input input-bordered"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">รหัสผ่าน</span>
                  </label>
                  <input
                    type="password"
                    placeholder="password"
                    className="input input-bordered"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-control mt-6">
                  <button className="btn btn-primary" onClick={handleLogin}>
                    เข้าสู่ระบบ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;
