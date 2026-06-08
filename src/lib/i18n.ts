import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const LANGUAGE_KEY = "@dormitory_language";

const getInitialLanguage = async () => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    return saved || "my";
  } catch {
    return "my";
  }
};

getInitialLanguage().then((lng) => {
  i18n.changeLanguage(lng);
});

i18n.use(initReactI18next).init({
  // compatibilityJSON: "v3",
  resources: {
    en: {
      translation: {
        // App
        appName: "ZMK Dormitory",
        appSubtitle: "Dormitory Management",
        // Stats
        totalRooms: "Total Rooms",
        rented: "Rented",
        available: "Available",
        persons: "Persons",
        // Room card
        tapToRent: "Tap to rent",
        countOfPerson: "persons",
        // Tabs
        home: "Home",
        history: "History",
        // Rental form
        rentalDetails: "Rental Details",
        newRental: "New Rental",
        monthlyPrice: "Monthly Price",
        forPersons: "for {{count}} persons",
        total: "Total",
        numberOfPersons: "Number of Persons",
        tenants: "Tenants",
        tenant: "Tenant",
        startDate: "Start Date",
        endDate: "End Date",
        duration: "{{months}} months ({{price}}MMK total)",
        paymentStatus: "Payment Status",
        paid: "Paid",
        unpaid: "Unpaid",
        saveRental: "Save Rental",
        fullName: "Full Name *",
        phoneNumber: "Phone Number",
        addPhoto: "Add Photo",
        tapToView: "Tap to view",
        removePhoto: "Remove Photo",
        removePhotoConfirm: "Remove this photo?",
        remove: "Remove",
        cancel: "Cancel",
        moveOut: "Move Out",
        moveOutConfirm: "Are you sure you want to move out from Room {{room}}?",
        missingName: "Please enter name for tenant {{num}}",
        invalidDates: "End date must be after start date",
        success: "Success",
        rentalSaved: "Room {{room}} rental saved!",
        ok: "OK",
        error: "Error",
        pinchZoom: "Pinch to zoom · Double-tap to reset",
        permissionNeeded: "Permission needed",
        permissionMsg: "Please allow access to your photo library.",
        missingInfo: "Missing Info",
        gender: { male: "Male", female: "Female" },
        // History
        rentalRecords: "Rental Records",
        activeRevenue: "Active Revenue",
        markPaid: "Mark Paid",
        markUnpaid: "Mark Unpaid",
        movedOut: "Moved Out",
        noRecords: "No records found",
        active: "Active",
        inactive: "Inactive",
        all: "All",
        blockA: "Block A",
        blockB: "Block B",
        loadingRooms: "Loading rooms...",
        monthly: "Monthly",
        duration2: "Duration",
        // Currency
        currency: "MMK",
      },
    },
    my: {
      translation: {
        // App
        appName: "ZMK အဆောင်",
        appSubtitle: "အဆောင်စီမံခန့်ခွဲမှု",
        // Stats
        totalRooms: "အခန်းစုစုပေါင်း",
        rented: "ငှားထား",
        available: "အခန်းလွတ်",
        persons: "လူဦးရေ",
        // Room card
        tapToRent: "ငှားရန် နှိပ်ပါ",
        countOfPerson: "ယောက်",
        // Tabs
        home: "ပင်မ",
        history: "မှတ်တမ်း",
        // Rental form
        rentalDetails: "ငှားရမ်းမှု အသေးစိတ်",
        newRental: "ငှားရမ်းမှု အသစ်",
        monthlyPrice: "လစဉ်ကြေး",
        forPersons: "လူ {{count}} ယောက်အတွက်",
        total: "စုစုပေါင်း",
        numberOfPersons: "လူဦးရေ",
        tenants: "နေထိုင်သူများ",
        tenant: "နေထိုင်သူ",
        startDate: "စတင်သည့်နေ့",
        endDate: "ကုန်ဆုံးသည့်နေ့",
        duration: "{{months}} လ ({{price}} ကျပ် စုစုပေါင်း)",
        paymentStatus: "ငွေပေးချေမှု အခြေအနေ",
        paid: "ပေးပြီး",
        unpaid: "မပေးရသေး",
        saveRental: "သိမ်းဆည်းရန်",
        fullName: "အမည် *",
        phoneNumber: "ဖုန်းနံပါတ်",
        addPhoto: "ဓာတ်ပုံ ထည့်ရန်",
        tapToView: "ကြည့်ရန် နှိပ်ပါ",
        removePhoto: "ဓာတ်ပုံ ဖယ်ရှားရန်",
        removePhotoConfirm: "ဤဓာတ်ပုံကို ဖယ်ရှားမည်လား?",
        remove: "ဖယ်ရှားမည်",
        cancel: "မလုပ်တော့ပါ",
        moveOut: "ထွက်ခွာရန်",
        moveOutConfirm: "အခန်း {{room}} မှ ထွက်ခွာမည်မှာ သေချာပါသလား?",
        missingName: "နေထိုင်သူ {{num}} ၏ အမည်ထည့်ပါ",
        invalidDates: "ကုန်ဆုံးနေ့သည် စတင်နေ့ထက် နောက်ကျရမည်",
        success: "အောင်မြင်သည်",
        rentalSaved: "အခန်း {{room}} သိမ်းဆည်းပြီးပါပြီ!",
        ok: "အိုကေ",
        error: "အမှား",
        pinchZoom: "ချုံ့/ချဲ့ရန် · နှစ်ချက်နှိပ်ပါ",
        permissionNeeded: "ခွင့်ပြုချက် လိုအပ်သည်",
        permissionMsg: "ဓာတ်ပုံသို့ ဝင်ခွင့်ပြုပါ",
        missingInfo: "အချက်အလက် မပြည့်စုံ",
        gender: { male: "ကျား", female: "မ" },
        // History
        rentalRecords: "အငှားမှတ်တမ်းများ",
        activeRevenue: "လက်ရှိဝင်ငွေ",
        markPaid: "ပေးပြီးဟု မှတ်မည်",
        markUnpaid: "မပေးရသေးဟု မှတ်မည်",
        movedOut: "ထွက်ခွာပြီး",
        noRecords: "မှတ်တမ်း မတွေ့ပါ",
        active: "လက်ရှိ",
        inactive: "ပြီးဆုံး",
        all: "အားလုံး",
        blockA: "အပိုင်း A",
        blockB: "အပိုင်း B",
        loadingRooms: "အခန်းများ တင်နေသည်...",
        monthly: "လစဉ်",
        duration2: "ကြာချိန်",
        // Currency
        currency: "ကျပ်",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

export const changeLanguage = async (languageCode: string) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.error("Change language error:", error);
  }
};
