import React from "react";

function Dashborad() {
  return (
    <>
      <h1 className="text-2xl mb-5">ภาพรวมบริษัท</h1>
      <div className="flex h-1/2 mb-5">
        <div className="h-full flex-initial w-4/12 bg-white mr-5 rounded-box place-items-center lg:w-1/2 "></div>
        <div className="h-full bg-white flex-initial w-8/12  rounded-box place-items-center lg:w-1/2"></div>
      </div>
      <div className="flex h-1/2  mb-5">
        <div className="h-full flex-initial w-4/12 bg-white mr-5 rounded-box place-items-center lg:w-1/2 "></div>
        <div className="h-full bg-white flex-initial w-8/12  rounded-box place-items-center lg:w-1/2"></div>
      </div>
      <div className="flex h-1/2  mb-5">
        <div className="h-full flex-initial w-4/12 bg-white mr-5 rounded-box place-items-center lg:w-1/2 "></div>
        <div className="h-full bg-white flex-initial w-8/12  rounded-box place-items-center lg:w-1/2"></div>
      </div>
    </>
  );
}

export default Dashborad;
