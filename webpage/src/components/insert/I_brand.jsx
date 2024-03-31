import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_brand() {
  const [values, setValues] = useState({ brand_name: "" });
  const [errors, setErrors] = useState({});

  const validationSchema = Yup.object({
    brand_name: Yup.string().required("กรุณากรอกชื่อ แบรนด์"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleInsert();
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/brand/insert",
        values
      );
      toast.info(response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hibrandrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      // Check if the response contains the expected message
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hibrandrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">เพิ่มแบรนด์</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">ชื่อแบรนด์</label>
            <input
              type="text"
              placeholder="กรอกชื่อแบรนด์"
              className="input input-bordered w-full mb-2"
              onChange={(e) => setValues({ brand_name: e.target.value })}
            />
            {errors.brand_name && (
              <span className="text-error">{errors.brand_name}</span>
            )}
            <button type="submit" className="btn btn-primary w-full">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_brand;
