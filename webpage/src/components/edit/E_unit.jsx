import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_unit() {
  const axios = useAxiosPrivate();
  const [values, setValues] = useState({ unit_name: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    unit_name: Yup.string().required("กรุณากรอกชื่อ หน่วยนับ"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleEdit();
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });

      setErrors(newErrors);
    }
  };
  const handleEdit = async () => {
    try {
      await axios
        .put("/unit/edit/" + id, values)
        .then((res) => navigate("/unit", { state: { msg: res.data.msg } }));
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hiunitrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  useEffect(() => {
    axios
      .get("/getunit/" + id)
      .then((res) => setValues({ unit_name: res.data[0].unit_name }))
      .catch((err) => console.log(err));
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">แก้ไขหน่วยนับ</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">ชื่อหน่วยนับ</label>
            <input
              type="text"
              placeholder="กรอกชื่อหน่วยนับ"
              value={values.unit_name}
              className="input input-bordered w-full mb-2"
              onChange={(e) => setValues({ unit_name: e.target.value })}
            />
            {errors.unit_name && (
              <span className="text-error">{errors.unit_name}</span>
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

export default E_unit;
