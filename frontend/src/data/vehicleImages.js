const vehicleImageMap = {
  "Honda Civic": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/Honda_Civic_Hybrid_%282022%2C_Europe%29_1X7A1558.jpg/1280px-Honda_Civic_Hybrid_%282022%2C_Europe%29_1X7A1558.jpg",
  "Toyota Fortuner": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/2015_Toyota_Fortuner_%28New_Zealand%29.jpg/1280px-2015_Toyota_Fortuner_%28New_Zealand%29.jpg",
  "Hyundai i20": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Hyundai_i20_%28BC3%29_Facelift_Auto_Zuerich_2023_1X7A0968.jpg/1280px-Hyundai_i20_%28BC3%29_Facelift_Auto_Zuerich_2023_1X7A0968.jpg",
  "BMW 5 Series": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/BMW_5_SERIES_LWB_SEDAN_%28G60%29_China.jpg/1280px-BMW_5_SERIES_LWB_SEDAN_%28G60%29_China.jpg",
  "Ford Ranger": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg/1280px-Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg",
  "Tesla Model 3": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Tesla_Model_3_%282023%29_Auto_Zuerich_2023_1X7A1313.jpg/1280px-Tesla_Model_3_%282023%29_Auto_Zuerich_2023_1X7A1313.jpg",
  "Maruti Swift": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg/1280px-2018_Suzuki_Swift_SZ5_Boosterjet_SHVS_1.0_Front.jpg",
  "Mahindra Thar": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Mahindra_Thar_CRDi_%2816183560860%29.jpg/1280px-Mahindra_Thar_CRDi_%2816183560860%29.jpg",
  "Tata Nexon EV": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/2020_Tata_Nexon_EV_%28India%29_front_view.png/1280px-2020_Tata_Nexon_EV_%28India%29_front_view.png",
  "Audi Q7": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Audi_Q7_4L_China_2014-04-25.jpg/1280px-Audi_Q7_4L_China_2014-04-25.jpg"
};

export function getVehicleImage(vehicle) {
  const modelImage = vehicleImageMap[`${vehicle.brand} ${vehicle.model}`];
  return modelImage || fallbackVehicleImage;
}

export const fallbackVehicleImage = "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/1957_Volkswagen_Beetle%2C_export_model%2C_in_front_of_Porta_Nigra_in_Trier_2023-05-01.jpg/1280px-1957_Volkswagen_Beetle%2C_export_model%2C_in_front_of_Porta_Nigra_in_Trier_2023-05-01.jpg";