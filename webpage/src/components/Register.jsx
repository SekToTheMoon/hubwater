import React, { useState, useEffect } from "react";
import { ErrorMessage, Formik, Form, Field } from "formik";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as yup from "yup";

function Register({ isLoggedIn = false }) {
  const [hiredate, setHiredate] = useState(new Date());
  const [bdate, setBdate] = useState(new Date());

  //จัดการปุ่มเพิ่ม input เบอร์โทร
  const [val, setVal] = useState([""]);
  const handleAdd = () => {
    setVal([...val, ""]);
  };
  const handleChange = (onChangeValue, i) => {
    const inputdata = [...val];
    inputdata[i] = onChangeValue.target.value;
    setVal(inputdata);
    console.log(val);
  };

  const handleDelete = (i) => {
    const deletVal = [...val];
    deletVal.splice(i, 1);
    setVal(deletVal);
  };

  //จัดการไฟล์รูปภาพ
  const [images, setImage] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const handleFileChange = (e) => {
    if (e.target.files.length === 1) {
      setImage([e.target.files[0]]);
      console.log(images);
    } else {
      console.log("เลือกรูปได้เพียง 1 รูป");
    }
  };

  useEffect(() => {
    if (images.length !== 1) return;

    const newImageURL = URL.createObjectURL(images[0]);
    setImageURL(newImageURL);
    console.log(images);
    console.log(imageURL);
    return () => {
      // Cleanup เมื่อ Component ถูก unmount
      URL.revokeObjectURL(newImageURL);
    };
  }, [images]);

  const handleRegister = async (values) => {
    console.log(values.email);
    console.log(values.password);
    console.log(values.fname);
    console.log(values.lname);
    console.log(bdate);
    console.log(hiredate);
    console.log(values.line);
    console.log(val);
    console.log(values.sex);
    console.log(values.username);
    console.log(values.nid);
    console.log(values.address);
    console.log(values.img);
    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("fname", values.fname);
      formData.append("lname", values.lname);
      formData.append("bdate", bdate);
      formData.append("hiredate", hiredate);
      formData.append("line", values.line);
      formData.append("phone", val);
      formData.append("sex", values.sex);
      formData.append("username", values.username);
      formData.append("nid", values.nid);
      formData.append("address", values.address);
      formData.append("img", images);
      const response = await axios
        .post("http://localhost:3001/register", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {});
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });

        // You might want to handle navigation or state updates in a more React-friendly way
        window.location.reload();
      } else {
        // Handle unexpected response format
        console.error("Unexpected response format:", response);
      }

      // Check if the response contains the expected message
    } catch (error) {
      // Handle network errors or other issues
      console.error("Error during registration:", error);
      toast.error("Error during registration", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const validationRegister = yup.object().shape({
    email: yup.string().email("Email invalid").required("Email is required"),
    fname: yup.string().required("ต้องกรอกชื่อ"),
    password: yup
      .string()
      .min(6, "กรอกรหัสผ่านไม่น้อยกว่า 12 หลัก")
      .required("ต้องกรอกรหัสผ่าน"),

    confirmation: yup
      .string()
      .oneOf([yup.ref("password"), null], "The passwords are different")
      .required("Password confirmation is mandatory"),
    nid: yup.string().required("กรอกข้อมูลให้ครบ 12 หลัก"),
    lname: yup.string().required("ต้องกรอกนามสกุล"),
    line: yup.string().required("ต้องกรอก LINE ID"),
    username: yup.string().required("ต้องกรอกชื่อผู้ใช้"),
    address: yup.string().required("ต้องกรอกที่อยู่"),
  });

  return (
    <div>
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-center text-2xl">Register Page</h1>
        <hr className="my-4" />

        <Formik
          initialValues={{}}
          onSubmit={(values) => handleRegister(values)}
          validationSchema={validationRegister}
        >
          <Form className="max-w-sm mx-auto">
            <div className="flex justify-between">
              <div className="mb-5">
                <label
                  htmlFor="fname"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ชื่อ
                </label>
                <Field
                  type="text"
                  name="fname"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="ชื่อจริง"
                />

                <ErrorMessage
                  component="span"
                  name="fname"
                  className="form-error"
                />
              </div>
              <div className="mb-5">
                <label
                  htmlFor="lname"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  นามสกุล
                </label>
                <Field
                  type="text"
                  name="lname"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="นามสกุลจริง"
                />

                <ErrorMessage
                  component="span"
                  name="lname"
                  className="form-error"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div className="mb-5 w-6/12">
                <label
                  htmlFor="bdate"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ว/ด/ป ปีเกิด
                </label>
                <DatePicker
                  selected={bdate}
                  onChange={(date) => {
                    setBdate(date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />

                <ErrorMessage
                  component="span"
                  name="bdate"
                  className="form-error"
                />
              </div>
              <div className="mb-5 w-6/12">
                <label
                  htmlFor="hiredate"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  ว/ด/ป ที่เข้าทำงาน
                </label>
                <DatePicker
                  selected={hiredate}
                  onChange={(date) => {
                    setHiredate(date);
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                <ErrorMessage
                  component="span"
                  name="hiredate"
                  className="form-error"
                />
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="sex"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                เพศ
              </label>
              <Field
                as="select"
                className="select select-bordered w-full max-w-xs"
                name="sex"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </Field>

              <ErrorMessage
                component="span"
                name="sex"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="img"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                รูป
              </label>
              <input
                type="file"
                name="img"
                accept="image/*"
                className="file-input file-input-bordered w-full max-w-xs"
                onChange={handleFileChange}
              />
              {imageURL && (
                <div className="w-100 flex justify-center h-40 bg-base-200">
                  <img className="w-100" src={imageURL} alt="uploaded" />
                </div>
              )}

              <ErrorMessage
                component="span"
                name="img"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="phone"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                เบอร์โทร
              </label>
              <div className="flex">
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={handleAdd}
                >
                  Add
                </button>
                <div className="w-full">
                  {val.map((data, i) => {
                    return (
                      <div key={`phone[${i}]`} className="w-full">
                        <div className="flex">
                          <Field
                            type="text"
                            name={`phone[${i}]`}
                            value={data}
                            onChange={(e) => handleChange(e, i)}
                            className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          />
                          {i !== 0 && (
                            <button
                              className="mx-auto btn btn-accent"
                              type="button"
                              onClick={() => handleDelete(i)}
                            >
                              x
                            </button>
                          )}
                        </div>
                        <ErrorMessage
                          component="span"
                          name="phone"
                          className="form-error"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="line"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                ID LINE
              </label>
              <Field
                type="text"
                name="line"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />

              <ErrorMessage
                component="span"
                name="line"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="address"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                ที่อยู่
              </label>
              <Field
                type="text"
                name="address"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />

              <ErrorMessage
                component="span"
                name="address"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="nid"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                เลขประจำตัวประชาชน
              </label>
              <Field
                type="nid"
                name="nid"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="รหัส 12 หลัก"
              />

              <ErrorMessage
                component="span"
                name="nid"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Your email
              </label>
              <Field
                type="email"
                name="email"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@flowbite.com"
              />

              <ErrorMessage
                component="span"
                name="email"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="username"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                ชื่อบัญชี
              </label>
              <Field
                type="text"
                name="username"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@flowbite.com"
              />

              <ErrorMessage
                component="span"
                name="username"
                className="form-error"
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Your password
              </label>
              <Field
                type="password"
                name="password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Password"
              />
              <ErrorMessage
                component="span"
                name="password"
                className="form-error"
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="confirm password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Confirm password
              </label>
              <Field
                type="password"
                name="confirmation"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Confirm Password"
              />
              <ErrorMessage
                component="span"
                name="confirmation"
                className="form-error"
              />
            </div>

            <button
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Register
            </button>
          </Form>
        </Formik>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
}

export default Register;
