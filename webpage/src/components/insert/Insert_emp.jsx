import React, { useState, useEffect } from "react";
import { ErrorMessage, Formik, Form, Field } from "formik";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as yup from "yup";

function Test({ isLoggedIn = false }) {
  const axios = useAxiosPrivate();

  //จัดการวันที่
  const [hiredate, setHiredate] = useState(new Date());
  const [bdate, setBdate] = useState(new Date());
  const [province, setProvince] = useState([]);
  //จัดการปุ่มเพิ่ม input เบอร์โทร
  const [val, setVal] = useState([""]);
  const handleAdd = () => {
    setVal([...val, ""]);
  };
  const handleChange = (onChangeValue, i) => {
    const inputdata = [...val];
    inputdata[i] = onChangeValue.target.value;
    setVal(inputdata);
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
    } else {
      console.log("เลือกรูปได้เพียง 1 รูป");
    }
  };
  useEffect(() => {
    if (images.length !== 1) return;

    const newImageURL = URL.createObjectURL(images[0]);
    setImageURL(newImageURL);
    console.log(images);

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
    console.log(images[0].name);
    const formData = new FormData();

    formData.append("commit", values.commit);
    formData.append("salary", values.salary);
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("fname", values.fname);
    formData.append("lname", values.lname);
    formData.append("bdate", bdate);
    formData.append("hiredate", hiredate);
    formData.append("line", values.line);
    formData.append("sex", values.sex);
    formData.append("username", values.username);
    formData.append("nid", values.nid);
    formData.append("address", values.address);
    formData.append("img", images[0]);
    val.forEach((element) => {
      formData.append("phone", element);
    });
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `/employee?page=${currentPage}&per_page=${perPage}`
        );

        setProvince(response.data.data);
        setTotalRows(response.data.total);
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    try {
      const response = await axios.post("/employee/insert", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Check if the response contains the expected message
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

  return (
    <>
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl ">เพิ่มพนักงาน</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <Formik
            initialValues={{
              sex: "",
            }}
            onSubmit={(values) => handleRegister(values)}
          >
            <Form className="max-w-sm mx-auto 2xl:max-w-7xl">
              <div className="mt-5 2xl:flex gap-x-5">
                <div className="flex-1 mb-5 ">
                  <label
                    htmlFor="dep"
                    className="block mb-2 text-sm font-medium  "
                  >
                    แผนก
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="dep"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="dep"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="position"
                    className="block mb-2 text-sm font-medium  "
                  >
                    ตำแหน่ง
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="position"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="dep"
                    className="form-error"
                  />
                </div>
                <div className=" flex-1 mb-5">
                  <label
                    htmlFor="hiredate"
                    className="block mb-2 text-sm font-medium  "
                  >
                    วันเริ่มทำงาน
                  </label>
                  <input
                    type="date"
                    selected={hiredate}
                    onChange={(e) => {
                      setHiredate(e.target.value);
                      console.log(e.target.value); // ใช้ e.target.value แทน e.target.Date
                    }}
                    dateformat="yyyy-MM-dd"
                    className="input input-bordered w-full "
                  />

                  <ErrorMessage
                    component="span"
                    name="hiredate"
                    className="form-error"
                  />
                </div>
              </div>
              <div className="mt-5 2xl:flex gap-x-5">
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="fname"
                    className="block mb-2 text-sm font-medium  "
                  >
                    ชื่อ
                  </label>
                  <Field
                    type="text"
                    name="fname"
                    className="input input-bordered w-full "
                    placeholder="ชื่อจริง"
                  />

                  <ErrorMessage
                    component="span"
                    name="fname"
                    className="form-error"
                  />
                </div>
                <div className=" flex-1 mb-5">
                  <label
                    htmlFor="lname"
                    className="block mb-2 text-sm font-medium "
                  >
                    นามสกุล
                  </label>
                  <Field
                    type="text"
                    name="lname"
                    className="input input-bordered w-full "
                    placeholder="นามสกุลจริง"
                  />

                  <ErrorMessage
                    component="span"
                    name="lname"
                    className="form-error"
                  />
                </div>
              </div>
              <div className="mt-5 2xl:flex gap-x-5">
                <div className="flex-none mb-5 2xl:w-1/6">
                  <label
                    htmlFor="sex"
                    className="block mb-2 text-sm font-medium  "
                  >
                    เพศ
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="sex"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="sex"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="bdate"
                    className="block mb-2 text-sm font-medium  "
                  >
                    วัน/เดือน/ปี เกิด
                  </label>
                  <input
                    type="date"
                    selected={bdate}
                    onChange={(e) => {
                      setBdate(e.target.value);
                      console.log(e.target.value); // ใช้ e.target.value แทน e.target.Date
                    }}
                    dateformat="yyyy-MM-dd"
                    className="input input-bordered w-full "
                  />

                  <ErrorMessage
                    component="span"
                    name="bdate"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="nid"
                    className="block mb-2 text-sm font-medium  "
                  >
                    เลขประจำตัวประชาชน
                  </label>
                  <Field
                    type="nid"
                    name="nid"
                    className="input input-bordered w-full "
                    placeholder="รหัส 12 หลัก"
                  />

                  <ErrorMessage
                    component="span"
                    name="nid"
                    className="form-error"
                  />
                </div>
              </div>
              <div className="mb-5">
                <label
                  htmlFor="address"
                  className="block mb-2 text-sm font-medium  "
                >
                  ที่อยู่ปัจจุบัน
                </label>
                <Field
                  type="text"
                  name="address"
                  className="input input-bordered w-full "
                  placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
                />

                <ErrorMessage
                  component="span"
                  name="address"
                  className="form-error"
                />
              </div>
              <div className="mt-5 2xl:flex gap-x-5">
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="sex"
                    className="block mb-2 text-sm font-medium  "
                  >
                    จังหวัด
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="sex"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">กหหดกหดกห</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="sex"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="sex"
                    className="block mb-2 text-sm font-medium  "
                  >
                    อำเภอ
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="sex"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="sex"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="sex"
                    className="block mb-2 text-sm font-medium  "
                  >
                    ตำบล
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="sex"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="sex"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="sex"
                    className="block mb-2 text-sm font-medium  "
                  >
                    รหัสไปรษณีย์
                  </label>
                  <Field
                    as="select"
                    className="select select-bordered w-full "
                    name="sex"
                  >
                    <option disabled value="">
                      เลือก
                    </option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </Field>

                  <ErrorMessage
                    component="span"
                    name="sex"
                    className="form-error"
                  />
                </div>
              </div>

              <div className="mt-5 2xl:flex gap-x-5">
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="salary"
                    className="block mb-2 text-sm font-medium  "
                  >
                    เงินเดือน
                  </label>
                  <Field
                    type="text"
                    name="salary"
                    className="input input-bordered w-full "
                    placeholder="เงินเดือน"
                  />

                  <ErrorMessage
                    component="span"
                    name="salary"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="fname"
                    className="block mb-2 text-sm font-medium  "
                  >
                    ค่าคอมมิชชั่น
                  </label>
                  <Field
                    type="text"
                    name="commit"
                    className="input input-bordered w-full "
                    placeholder="เปอร์เซ็นต์"
                  />

                  <ErrorMessage
                    component="span"
                    name="commit"
                    className="form-error"
                  />
                </div>
              </div>
              <div className="mt-5 2xl:flex gap-x-5">
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium  "
                  >
                    อีเมล
                  </label>
                  <Field
                    type="email"
                    name="email"
                    className="input input-bordered w-full "
                    placeholder="ชืออีเมล@gemail.com"
                  />

                  <ErrorMessage
                    component="span"
                    name="email"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="line"
                    className="block mb-2 text-sm font-medium  "
                  >
                    ID LINE
                  </label>
                  <Field
                    type="text"
                    name="line"
                    className="input input-bordered w-full "
                  />

                  <ErrorMessage
                    component="span"
                    name="line"
                    className="form-error"
                  />
                </div>
              </div>
              <div className="mt-5 2xl:flex gap-x-5">
                <div className=" flex-1 mb-5">
                  <label
                    htmlFor="img"
                    className="block mb-2 text-sm font-medium  "
                  >
                    รูป
                  </label>
                  <Field
                    as="input"
                    type="file"
                    name="img"
                    accept="image/*"
                    className="file-input file-input-bordered w-full "
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
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="phone"
                    className="block mb-2 text-sm font-medium  "
                  >
                    เบอร์โทร
                  </label>
                  <div className="flex">
                    <div className="w-full">
                      {val.map((data, i) => {
                        return (
                          <div key={`phone[${i}]`} className="w-full">
                            <div className="flex  mb-1">
                              <Field
                                type="text"
                                name={`phone[${i}]`}
                                value={data}
                                onChange={(e) => handleChange(e, i)}
                                className="input input-bordered w-full "
                              />
                              {i == 0 && (
                                <button
                                  type="button"
                                  className="btn btn-primary w-16"
                                  onClick={handleAdd}
                                >
                                  เพิ่ม
                                </button>
                              )}
                              {i !== 0 && (
                                <button
                                  className="mx-auto btn btn-accent w-16"
                                  type="button"
                                  onClick={() => handleDelete(i)}
                                >
                                  ลบ
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              <div className="mt-5 2xl:flex gap-x-5">
                <div className=" flex-1 mb-5">
                  <label
                    htmlFor="username"
                    className="block mb-2 text-sm font-medium  "
                  >
                    ชื่อบัญชี
                  </label>
                  <Field
                    type="text"
                    name="username"
                    className="input input-bordered w-full "
                    placeholder="Username"
                  />

                  <ErrorMessage
                    component="span"
                    name="username"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium  "
                  >
                    Your password
                  </label>
                  <Field
                    type="password"
                    name="password"
                    className="input input-bordered w-full "
                    placeholder="Password"
                  />
                  <ErrorMessage
                    component="span"
                    name="password"
                    className="form-error"
                  />
                </div>
                <div className="flex-1 mb-5">
                  <label
                    htmlFor="confirm password"
                    className="block mb-2 text-sm font-medium  "
                  >
                    Confirm password
                  </label>
                  <Field
                    type="password"
                    name="confirmation"
                    className="input input-bordered w-full "
                    placeholder="Confirm Password"
                  />
                  <ErrorMessage
                    component="span"
                    name="confirmation"
                    className="form-error"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full mb-5">
                ตกลง
              </button>
            </Form>
          </Formik>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Test;
