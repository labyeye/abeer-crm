const messageTemplates = {
  
  quotation_created: {
    hindi: "आपने {location} पर {service} के लिए enquiry किया था। आपका quotation तैयार है। कृपया {link} पर click करके देखें। किसी प्रकार की सहायता के लिए संपर्क करें।",
    english: "Thank you for your inquiry for {service} at {location}. Your quotation is ready. Please click {link} to view details. Contact us for any assistance."
  },

  
  quotation_followup_7days: {
    hindi: "आपने enquiry किया था, कोई समस्या हुई क्या – Rate, Quality, Other? कृपया हमें बताएं या {link} पर click करके booking confirm करें।",
    english: "You had inquired with us. Is there any issue - Rate, Quality, or Other? Please let us know or click {link} to confirm booking."
  },

  
  appointment_reminder: {
    hindi: "आपने {date} को visit करने का समय दिया था। कृपया समय पर पधारें। Address: {address}. संपर्क: {phone}",
    english: "You have scheduled a visit on {date}. Please arrive on time. Address: {address}. Contact: {phone}"
  },

  
  appointment_missed: {
    hindi: "आप आज नहीं आए, कोई समस्या है? कृपया नया appointment book करने के लिए {link} पर click करें या call करें।",
    english: "You didn't come today, is there any problem? Please click {link} to book new appointment or call us."
  },

  
  booking_confirmed: {
    hindi: "आपका appointment {date} को confirm हुआ है। Function: {function}, Time: {time}, Venue: {venue}. Staff details: {staffDetails}",
    english: "Your appointment is confirmed for {date}. Function: {function}, Time: {time}, Venue: {venue}. Staff details: {staffDetails}"
  },

  
  payment_reminder: {
    hindi: "आपकी dues ₹{amount} है, आज {time} तक भुगतान करना है। Invoice: {invoiceNumber}. Payment link: {link}",
    english: "Your dues amount is ₹{amount}, payment due by {time} today. Invoice: {invoiceNumber}. Payment link: {link}"
  },

  
  photo_selection_reminder: {
    hindi: "आपके पास {link} है, कृपया फोटो select करें। Album: {pageCount} pages. Last date: {lastDate}",
    english: "Please click {link} to select photos. Album: {pageCount} pages. Last date: {lastDate}"
  },

  
  work_delivery: {
    hindi: "आपका काम तैयार है, कृपया collect करें। Branch: {branchName}, Address: {address}, Time: {timing}",
    english: "Your work is ready, please collect. Branch: {branchName}, Address: {address}, Time: {timing}"
  },

  
  post_delivery_followup: {
    hindi: "अगर कोई सुधार है तो 1 सप्ताह में करवा लें। कोई समस्या हो तो call करें। {link} पर feedback दें।",
    english: "If any corrections needed, please do within 1 week. Call if any issues. Give feedback at {link}."
  },

  
  review_request: {
    hindi: "अगर आप संतुष्ट हैं तो कृपया Review दें। {link} पर rating और feedback share करें। आपकी राय हमारे लिए महत्वपूर्ण है।",
    english: "If you are satisfied, please give us a review. Share rating and feedback at {link}. Your opinion matters to us."
  },

  
  task_assigned: {
    hindi: "नया काम assign हुआ है। Date: {date}, Time: {time}, Location: {location}, Client: {client}. Details: {link}",
    english: "New task assigned. Date: {date}, Time: {time}, Location: {location}, Client: {client}. Details: {link}"
  },

  
  staff_assignment: {
    hindi: "आपके काम के लिए staff assign हुआ है। Team: {teamMembers}, Equipment: {equipment}, Contact: {contact}. Details: {link}",
    english: "Staff has been assigned for your work. Team: {teamMembers}, Equipment: {equipment}, Contact: {contact}. Details: {link}"
  },

  
  travel_details: {
    hindi: "Travel Details - Destination: {destination}, Date: {date}, Transport: {transport}, Budget: ₹{budget}, Cash Given: ₹{cashGiven}. Team: {team}",
    english: "Travel Details - Destination: {destination}, Date: {date}, Transport: {transport}, Budget: ₹{budget}, Cash Given: ₹{cashGiven}. Team: {team}"
  },

  
  task_skipped: {
    hindi: "आपके काम में {problem} की समस्या है। कृपया इसे सही करें या करवाएं। Contact: {contact}. Details: {link}",
    english: "There is an issue with {problem} in your work. Please correct it. Contact: {contact}. Details: {link}"
  }
};




const getTemplate = (type, language = 'hindi') => {
  return messageTemplates[type]?.[language] || messageTemplates[type]?.['english'] || '';
};




const formatMessage = (template, variables = {}) => {
  let message = template;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key] || '');
  });
  
  return message;
};




const generateSmartLink = (baseUrl, token, type) => {
  return `${baseUrl}/notification/${token}/${type}`;
};




const getMessage = (type, variables = {}, language = 'hindi') => {
  const template = getTemplate(type, language);
  return formatMessage(template, variables);
};

module.exports = {
  messageTemplates,
  getTemplate,
  formatMessage,
  generateSmartLink,
  getMessage
};
