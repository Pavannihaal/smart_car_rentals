export const seedAccounts = {
  owners: [
    {
      user_id: 9,
      company_id: 1,
      company_name: "Apex Car Rentals",
      contact_number: "+91 22888 87777",
      email: "apex_owner@gmail.com",
      address: "Apex Towers, Andheri East, Mumbai"
    },
    {
      user_id: 10,
      company_id: 2,
      company_name: "Elite Fleet Management",
      contact_number: "+91 80222 33444",
      email: "elite_owner@gmail.com",
      address: "Prestige Tech Park, Bengaluru"
    },
    {
      user_id: 11,
      company_id: 3,
      company_name: "ZoomRentals",
      contact_number: "+91 44555 66777",
      email: "zoom_owner@gmail.com",
      address: "Anna Salai, Chennai"
    }
  ],
  customers: [
    {
      user_id: 1,
      customer_id: 1,
      name: "Alice Johnson",
      email: "alice@gmail.com",
      phone: "+91 98765 43210",
      license_number: "DL-1234567890",
      license_status: "VERIFIED",
      address: "123 MG Road, Bengaluru"
    },
    {
      user_id: 2,
      customer_id: 2,
      name: "Bob Smith",
      email: "bob@yahoo.com",
      phone: "+91 98765 43211",
      license_number: "DL-1234567891",
      license_status: "VERIFIED",
      address: "456 Indiranagar, Bengaluru"
    },
    {
      user_id: 3,
      customer_id: 3,
      name: "Charlie Brown",
      email: "charlie@gmail.com",
      phone: "+91 98765 43212",
      license_number: "DL-1234567892",
      license_status: "VERIFIED",
      address: "789 Koramangala, Bengaluru"
    },
    {
      user_id: 4,
      customer_id: 4,
      name: "Diana Prince",
      email: "diana@hotmail.com",
      phone: "+91 98765 43213",
      license_number: "DL-1234567893",
      license_status: "VERIFIED",
      address: "101 Whitefield, Bengaluru"
    }
  ]
};

export const users = {
  customer: seedAccounts.customers[0],
  owner: seedAccounts.owners[0]
};

export function getCurrentSessionUser(area) {
  try {
    const session = JSON.parse(localStorage.getItem("smartcar_session") || "null");
    if (session) {
      if (area === "customer" || session.role === "customer") {
        const found = seedAccounts.customers.find(
          (c) => c.customer_id === session.customer_id || (session.email && c.email.toLowerCase() === session.email.toLowerCase())
        );
        if (found) {
          return {
            name: found.name,
            email: found.email,
            detail: found.email,
            customer_id: found.customer_id,
            user_id: found.user_id
          };
        }
        if (session.name || session.email) {
          return {
            name: session.name || session.email,
            email: session.email || "customer@example.com",
            detail: session.email || "Verified customer"
          };
        }
      }
      if (area === "owner" || session.role === "owner") {
        const found = seedAccounts.owners.find(
          (o) => o.user_id === session.user_id || (session.email && o.email.toLowerCase() === session.email.toLowerCase())
        );
        if (found) {
          return {
            name: found.company_name,
            email: found.email,
            detail: found.email,
            company_id: found.company_id,
            user_id: found.user_id
          };
        }
        if (session.company_name || session.email) {
          return {
            name: session.company_name || session.email,
            email: session.email || "owner@example.com",
            detail: session.email || "Fleet admin"
          };
        }
      }
    }
  } catch (e) {
    // Ignore parse errors
  }

  return area === "owner"
    ? { name: users.owner.company_name, email: users.owner.email, detail: users.owner.email, company_id: users.owner.company_id, user_id: users.owner.user_id }
    : { name: users.customer.name, email: users.customer.email, detail: users.customer.email, customer_id: users.customer.customer_id, user_id: users.customer.user_id };
}

