import React from "react";
import { Link } from "react-router-dom";

function MobileTable({ data, onDelete, htmlTemplate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
      {data.map((item, index) => {
        const rowData = Object.values(item);
        return (
          <div
            key={index}
            className="space-y-3 p-4 items-start rounded-lg shadow"
          >
            <div className="flex justify-between ">
              {/* เรียกใช้ htmlTemplate โดยส่ง rowData เป็นพารามิเตอร์ */}
              {htmlTemplate(rowData)}

              <div className="flex-1 max-w-14 flex flex-col justify-center space-y-2">
                <Link
                  to={`edit/${rowData[0]}`}
                  className="btn btn-warning text-warning-content btn-sm opacity-80"
                >
                  แก้ไข
                </Link>
                <button
                  className="btn btn-error btn-sm text-error-content opacity-80"
                  onClick={() => onDelete(rowData[0])}
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MobileTable;
