import React, { useEffect, useState } from "react";
import axios from "./api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuth from "./hooks/useAuth";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import rainbowVortex from "./assets/rainbow-vortex.svg";
function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [values, setValues] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validationSchema = Yup.object({
    username: Yup.string().required("กรุณากรอก ชื่อบัญชี"),
    password: Yup.string()
      .required("กรุณากรอกรหัสผ่าน")
      .max(20, "รหัสผ่านไม่เกิน 20 ตัวอักษร"),
  });

  const handleLogin = async () => {
    try {
      await validationSchema.validate(values, { abortEarly: false });
      const response = await axios.post("/login", values, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (response.status === 200) {
        // เดี๋ยวต้องลบ
        localStorage.setItem("employee_id", response.data.employee_id);
        localStorage.setItem("employee_fname", response.data.employee_fname);
        localStorage.setItem("employee_lname", response.data.employee_lname);
        localStorage.setItem("employee_img", response.data.employee_img);
        localStorage.setItem("posit_name", response.data.posit_name);

        const permissionArray = response.data.posit_permission.split("");
        permissionArray.splice(0, 0, "1");
        setAuth({
          employee_id: response.data.employee_id,
          employee_fname: response.data.employee_fname,
          employee_lname: response.data.employee_lname,
          employee_img: response.data.employee_img,
          refreshToken: response.data.refreshToken,
          accessToken: response.data.token,
          posit_permission: permissionArray,
          posit_name: response.data.posit_name,
        });
        navigate("home");
      }
    } catch (error) {
      if (!error?.response) {
        console.log("error จากการ validate ข้อมูลไม่ถูกต้อง");
        const newErrors = {};
        error?.inner?.forEach((err) => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        toast.error(error.response.data.msg, {
          position: "top-right",
          autoClose: 5000,
          hibankrogressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    }
  };

  return (
    <>
      <main className="artboard flex justify-center h-screen">
        <div
          className="hero min-h-screen "
          style={{
            backgroundImage: `url(${rainbowVortex})`,
          }}
        >
          <div className="hero-content flex-col w-2/3 md:w-1/2 xl:w-1/3">
            <div className="text-center mb-2 ">
              <h1 className="text-3xl font-bold text-white opacity-75">
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
                    value={values.username}
                    onChange={(e) =>
                      setValues({ ...values, username: e.target.value })
                    }
                  />
                </div>
                {errors.username && (
                  <span className="text-error flex justify-start">
                    {errors.username}
                  </span>
                )}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">รหัสผ่าน</span>
                  </label>
                  <input
                    type="password"
                    placeholder="password"
                    className="input input-bordered"
                    value={values.password}
                    onChange={(e) =>
                      setValues({ ...values, password: e.target.value })
                    }
                  />
                </div>
                {errors.password && (
                  <span className="text-error flex justify-start">
                    {errors.password}
                  </span>
                )}
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
      <ToastContainer position="top-right" />
    </>
  );
}

export default Login;
