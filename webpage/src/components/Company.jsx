import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";

function Company() {
  const [values, setValues] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_taxpayer: "",
    province: "",
    district: "",
    subdistrict: "",
    zip_code: "",
  });

  const [errors, setErrors] = useState({});
  const [selectprovince, setSelectProvince] = useState([]);
  const [selectdistrict, setSelectDistrict] = useState([]);
  const [selectsubdistrict, setSelectSubdistrict] = useState([]);
  const [images, setImages] = useState({
    logo: "logo",
    signature: "signature",
  });
  const [imageURL, setImageURL] = useState([null, null]);

  const validationSchema = Yup.object({
    company_name: Yup.string().required("กรุณากรอกชื่อ"),
    company_address: Yup.string().required("กรุณากรอกที่อยู่"),
    // เพิ่ม validationSchema ต่อไปตามต้องการ
  });

  // จัดการไฟล์รูปภาพ
  const handleFileChange = (e, field) => {
    if (e.target.files.length === 1) {
      setImages({ ...images, [field]: e.target.files[0] });
    } else {
      console.log("เลือกรูปได้เพียง 1 รูป");
    }
  };

  const fetchProvince = async () => {
    await axios
      .get("http://localhost:3001/getprovince")
      .then((res) => {
        setSelectProvince(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchDistrict = async (province) => {
    await axios
      .get(`http://localhost:3001/getdistrict/${province}`)
      .then((res) => {
        setSelectDistrict(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchSubdistrict = async (district) => {
    await axios
      .get(`http://localhost:3001/getsubdistrict/${district}`)
      .then((res) => {
        setSelectSubdistrict(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    axios
      .get(`http://localhost:3001/getcompany`)
      .then((res) => {
        const companyData = res.data;
        setValues((prevValues) => ({
          ...prevValues,
          company_name: companyData.company_name,
          company_address: companyData.company_address,
          company_phone: companyData.company_phone,
          company_email: companyData.company_email,
          company_taxpayer: companyData.company_taxpayer,
          province: companyData.province,
          district: companyData.district,
          subdistrict: companyData.subdistrict_code,
          zip_code: companyData.zip_code,
        }));
        setImageURL([
          `http://localhost:3001/img/logo/logo.png`,
          `http://localhost:3001/img/signature/signature.png`,
        ]);
      })
      .catch((err) => console.log(err));
    fetchProvince();
  }, []);

  useEffect(() => {
    if (values.province) {
      fetchDistrict(values.province);
    }
  }, [values.province]);

  useEffect(() => {
    if (values.district) {
      fetchSubdistrict(values.district);
    }
  }, [values.district]);

  useEffect(() => {
    if (images.logo == "logo") return;
    const newImageURL = URL.createObjectURL(images.logo);
    setImageURL((prevImageURL) => {
      const updatedImageURL = [...prevImageURL];
      updatedImageURL[0] = newImageURL;
      return updatedImageURL;
    });

    return () => {
      URL.revokeObjectURL(newImageURL);
    };
  }, [images.logo]);

  useEffect(() => {
    if (images.logo == "logo") return;
    const newImageURL = URL.createObjectURL(images.signature);
    setImageURL((prevImageURL) => {
      const updatedImageURL = [...prevImageURL];
      updatedImageURL[1] = newImageURL;
      return updatedImageURL;
    });

    return () => {
      URL.revokeObjectURL(newImageURL);
    };
  }, [images.signature]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleEdit();
      setErrors({});
    } catch (error) {
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleEdit = async () => {
    const formData = new FormData();
    formData.append("company_name", values.company_name);
    formData.append("company_address", values.company_address);
    formData.append("company_phone", values.company_phone);
    formData.append("company_email", values.company_email);
    formData.append("company_taxpayer", values.company_taxpayer);
    formData.append("subdistrict_code", values.subdistrict);
    formData.append("logo", images.logo);
    formData.append("signature", images.signature);
    console.log(formData.values);
    try {
      const response = await axios.put(
        `http://localhost:3001/company/edit`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success(response.data, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
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
        <h1 className="ml-16 text-2xl">ค่าคงที่บริษัท</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto 2xl:max-w-7xl"
          >
            <div className="flex-1 mb-5">
              <label htmlFor="fname" className="block mb-2 text-sm font-medium">
                ชื่อบริษัท
              </label>
              <input
                type="text"
                value={values.company_name}
                onChange={(e) =>
                  setValues({ ...values, company_name: e.target.value })
                }
                className="input input-bordered w-full"
              />
              {errors.company_name && (
                <span className="text-error">{errors.company_name}</span>
              )}
            </div>

            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="company_taxpayer"
                  className="block mb-2 text-sm font-medium"
                >
                  เลขที่ผู้เสียภาษี
                </label>
                <input
                  type="text"
                  name="company_taxpayer"
                  value={values.company_taxpayer}
                  onChange={(e) =>
                    setValues({ ...values, company_taxpayer: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เลข 13 หลัก"
                />
                {errors.company_taxpayer && (
                  <span className="text-error">{errors.company_taxpayer}</span>
                )}
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="company_address"
                className="block mb-2 text-sm font-medium"
              >
                ที่อยู่
              </label>
              <input
                type="text"
                name="company_address"
                value={values.company_address}
                onChange={(e) =>
                  setValues({ ...values, company_address: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />
              {errors.company_address && (
                <span className="text-error">{errors.company_address}</span>
              )}
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="province" className="block mb-2 font-medium">
                  จังหวัด
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.province}
                  onChange={(e) => {
                    const selectedProvince = e.target.value;
                    setValues({
                      ...values,
                      province: selectedProvince,
                      district: "",
                      subdistrict: "",
                      zip_code: "",
                    });
                    fetchDistrict(selectedProvince);
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectprovince.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.province && (
                  <span className="text-error">{errors.province}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="district" className="block mb-2 font-medium">
                  อำเภอ
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.district}
                  onChange={(e) => {
                    const selectedDistrict = e.target.value;
                    setValues({
                      ...values,
                      district: selectedDistrict,
                      subdistrict: "",
                      zip_code: "",
                    });
                    fetchSubdistrict(selectedDistrict);
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectdistrict.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.district && (
                  <span className="text-error">{errors.district}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="subdistrict" className="block mb-2 font-medium">
                  ตำบล
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.subdistrict}
                  onChange={(e) => {
                    setValues({
                      ...values,
                      subdistrict: e.target.value.split(",")[0],
                      zip_code: e.target.value.split(",")[1],
                    });
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectsubdistrict.map((op) => (
                    <option key={op.code} value={[op.code, op.zip_code]}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.subdistrict && (
                  <span className="text-error">{errors.subdistrict}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="zip_code" className="block mb-2 font-medium">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  name="zip_code"
                  className="input input-bordered w-full mb-1"
                  readOnly
                  value={values.zip_code}
                />
                {errors.zip_code && (
                  <span className="text-error">{errors.zip_code}</span>
                )}
              </div>
            </div>

            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="company_phone"
                  className="block mb-2 text-sm font-medium"
                >
                  เบอร์โทร
                </label>
                <input
                  type="text"
                  name="company_phone"
                  value={values.company_phone}
                  onChange={(e) =>
                    setValues({ ...values, company_phone: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เบอร์โทร"
                />
                {errors.company_phone && (
                  <span className="text-error">{errors.company_phone}</span>
                )}
              </div>

              <div className="flex-1 mb-5">
                <label
                  htmlFor="company_email"
                  className="block mb-2 text-sm font-medium"
                >
                  อีเมล
                </label>
                <input
                  type="email"
                  name="company_email"
                  value={values.company_email}
                  onChange={(e) =>
                    setValues({ ...values, company_email: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="ชื่ออีเมล@gmail.com"
                />
                {errors.company_email && (
                  <span className="text-error">{errors.company_email}</span>
                )}
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="company_logo"
                  className="block mb-2 text-sm font-medium"
                >
                  รูปโลโก้
                </label>
                <input
                  type="file"
                  name="company_logo"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "logo")}
                  className="file-input file-input-bordered w-full"
                />
                {imageURL[0] && (
                  <div className="w-100 flex justify-center h-40 bg-base-200">
                    <img className="w-100" src={imageURL[0]} alt="uploaded" />
                  </div>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="company_signature"
                  className="block mb-2 text-sm font-medium"
                >
                  ตรายางอิเล็กทรอนิกส์
                </label>
                <input
                  type="file"
                  name="company_signature"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "signature")}
                  className="file-input file-input-bordered w-full"
                />
                {imageURL[1] && (
                  <div className="w-100 flex justify-center h-40 bg-base-200">
                    <img className="w-100" src={imageURL[1]} alt="uploaded" />
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mb-5">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Company;
