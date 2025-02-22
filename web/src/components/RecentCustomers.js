// components/RecentCustomers.js
import React from 'react';

const RecentCustomers = () => {
  return (
    <div className="recentCustomers">
      <div className="cardHeader">
        <h2>Recent Customers</h2>
      </div>
      <table>
        <tbody>
          {/* Repeatable rows */}
          <tr>
            <td width="60px">
              <div className="imgBx"><img src="assets/imgs/customer02.jpg" alt="customer" /></div>
            </td>
            <td>
              <h4>David <br /><span>Italy</span></h4>
            </td>
          </tr>
          {/* Add more rows as necessary */}
        </tbody>
      </table>
    </div>
  );
};

export default RecentCustomers;
