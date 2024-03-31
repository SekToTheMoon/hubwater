import React from "react";

function Login() {
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
              <h1 className="text-3xl font-bold text-base-200">
                ระบบร้านขายเครื่องกรองน้ำ
              </h1>
            </div>
            <div className="card shrink-0 w-full  shadow-2xl bg-base-100">
              <form className="card-body">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="email"
                    className="input input-bordered"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="password"
                    className="input input-bordered"
                    required
                  />
                  <label className="label">
                    <a href="#" className="label-text-alt link link-hover">
                      Forgot password?
                    </a>
                  </label>
                </div>
                <div className="form-control mt-6">
                  <button className="btn btn-primary">Login</button>
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
