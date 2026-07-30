export const authTranslations = {
  uz: {
    auth: {
      brand: 'Logistica',
      register: "Ro‘yxatdan o‘tish",
      login: 'Kirish',
      next: 'Keyingisi',
      verify: 'Tasdiqlash',
      gmail: 'Gmail',
      gmailPlaceholder: 'example@gmail.com',
      gate: {
        subtitle: 'Davom etish uchun tanlang',
      },
      loginScreen: {
        header: 'Kirish',
        title: 'Gmail orqali kirish',
        subtitle: 'Gmailingizga kelgan 6 xonali kod bilan kirasiz.',
      },
      registerScreen: {
        profileTitle: 'Logistica profili',
        profileSubtitle:
          "Kompaniya, davlat va Gmail ma’lumotlarini kiriting.",
        companyName: 'Kompaniya nomi',
        companyNamePlaceholder: 'Kompaniya nomi',
        country: 'Logistica davlati',
        selectCountry: 'Davlatni tanlang',
        loginTitle: 'Gmail orqali kirish',
        loginSubtitle: 'Gmailingizni kiriting — kod yuboriladi.',
        codeTitle: 'Parol / kod',
        codeSubtitle:
          '<highlight>{{email}}</highlight> manziliga yuborilgan 6 xonali kodni kiriting.',
        passwordCode: 'Parol (kod)',
        codePlaceholder: '******',
        changeGmail: "Gmailni o‘zgartirish",
      },
      otp: {
        title: 'Tasdiqlash kodi',
        description:
          '<highlight>{{email}}</highlight> manziliga yuborilgan 6 xonali kodni kiriting.',
        codePlaceholder: '______',
        resend: 'Kodni qayta yuborish',
        resending: 'Yuborilmoqda...',
      },
      pending: {
        title: 'Admin tasdiqlashini kuting',
        description:
          "Ro‘yxatdan o‘tish so‘rovingiz asosiy adminga yuborildi. Tasdiqlangach shu Gmail orqali hisobingizga kira olasiz.",
        checkStatus: 'Holatni tekshirish',
        goToLogin: 'Kirish sahifasiga',
        approved:
          "So‘rovingiz tasdiqlandi. Endi Gmail orqali kirishingiz mumkin.",
        stillPending: 'Hali ham admin tasdiqlashi kutilmoqda.',
        notFound:
          "So‘rov topilmadi yoki bekor qilingan. Qayta ro‘yxatdan o‘tishingiz mumkin.",
      },
      validation: {
        invalidGmail: "To‘g‘ri Gmail manzilini kiriting",
        companyNameRequired: 'Kompaniya nomini kiriting',
        countryRequired: 'Logistica davlatini tanlang',
        codeRequired: '6 xonali kodni kiriting',
      },
      errors: {
        codeNotSent: 'Kod yuborilmadi',
        codeNotVerified: 'Kod tasdiqlanmadi',
        codeNotResent: 'Kod qayta yuborilmadi',
        statusCheckFailed: "Holatni tekshirib bo‘lmadi",
      },
      countries: {
        china: 'Xitoy',
        usa: 'AQSH',
        turkey: 'Turkiya',
        korea: 'Koreya',
        japan: 'Yaponiya',
      },
    },
  },
  en: {
    auth: {
      brand: 'Logistica',
      register: 'Sign up',
      login: 'Log in',
      next: 'Next',
      verify: 'Verify',
      gmail: 'Gmail',
      gmailPlaceholder: 'example@gmail.com',
      gate: {
        subtitle: 'Choose how to continue',
      },
      loginScreen: {
        header: 'Log in',
        title: 'Log in with Gmail',
        subtitle: 'You will sign in with the 6-digit code sent to your Gmail.',
      },
      registerScreen: {
        profileTitle: 'Logistics profile',
        profileSubtitle: 'Enter your company, country, and Gmail details.',
        companyName: 'Company name',
        companyNamePlaceholder: 'Company name',
        country: 'Logistics country',
        selectCountry: 'Select a country',
        loginTitle: 'Log in with Gmail',
        loginSubtitle: 'Enter your Gmail — a code will be sent.',
        codeTitle: 'Password / code',
        codeSubtitle:
          'Enter the 6-digit code sent to <highlight>{{email}}</highlight>.',
        passwordCode: 'Password (code)',
        codePlaceholder: '******',
        changeGmail: 'Change Gmail',
      },
      otp: {
        title: 'Verification code',
        description:
          'Enter the 6-digit code sent to <highlight>{{email}}</highlight>.',
        codePlaceholder: '______',
        resend: 'Resend code',
        resending: 'Sending...',
      },
      pending: {
        title: 'Waiting for admin approval',
        description:
          'Your registration request was sent to the main admin. Once approved, you can sign in with this Gmail.',
        checkStatus: 'Check status',
        goToLogin: 'Go to login',
        approved:
          'Your request was approved. You can now sign in with Gmail.',
        stillPending: 'Still waiting for admin approval.',
        notFound:
          'Request not found or cancelled. You can register again.',
      },
      validation: {
        invalidGmail: 'Enter a valid Gmail address',
        companyNameRequired: 'Enter the company name',
        countryRequired: 'Select a logistics country',
        codeRequired: 'Enter the 6-digit code',
      },
      errors: {
        codeNotSent: 'Failed to send code',
        codeNotVerified: 'Failed to verify code',
        codeNotResent: 'Failed to resend code',
        statusCheckFailed: 'Could not check status',
      },
      countries: {
        china: 'China',
        usa: 'USA',
        turkey: 'Türkiye',
        korea: 'South Korea',
        japan: 'Japan',
      },
    },
  },
  zh: {
    auth: {
      brand: 'Logistica',
      register: '注册',
      login: '登录',
      next: '下一步',
      verify: '验证',
      gmail: 'Gmail',
      gmailPlaceholder: 'example@gmail.com',
      gate: {
        subtitle: '请选择继续方式',
      },
      loginScreen: {
        header: '登录',
        title: '通过 Gmail 登录',
        subtitle: '使用发送到您 Gmail 的 6 位验证码登录。',
      },
      registerScreen: {
        profileTitle: '物流资料',
        profileSubtitle: '请填写公司、国家和 Gmail 信息。',
        companyName: '公司名称',
        companyNamePlaceholder: '公司名称',
        country: '物流所在国家',
        selectCountry: '请选择国家',
        loginTitle: '通过 Gmail 登录',
        loginSubtitle: '请输入您的 Gmail — 将发送验证码。',
        codeTitle: '密码 / 验证码',
        codeSubtitle:
          '请输入发送至 <highlight>{{email}}</highlight> 的 6 位验证码。',
        passwordCode: '密码（验证码）',
        codePlaceholder: '******',
        changeGmail: '更改 Gmail',
      },
      otp: {
        title: '验证码',
        description:
          '请输入发送至 <highlight>{{email}}</highlight> 的 6 位验证码。',
        codePlaceholder: '______',
        resend: '重新发送验证码',
        resending: '发送中...',
      },
      pending: {
        title: '等待管理员审核',
        description:
          '您的注册申请已发送给主管理员。审核通过后，即可使用此 Gmail 登录账户。',
        checkStatus: '检查状态',
        goToLogin: '前往登录页',
        approved: '您的申请已通过。现在可通过 Gmail 登录。',
        stillPending: '仍在等待管理员审核。',
        notFound: '未找到申请或申请已取消。您可以重新注册。',
      },
      validation: {
        invalidGmail: '请输入有效的 Gmail 地址',
        companyNameRequired: '请输入公司名称',
        countryRequired: '请选择物流所在国家',
        codeRequired: '请输入 6 位验证码',
      },
      errors: {
        codeNotSent: '验证码发送失败',
        codeNotVerified: '验证码验证失败',
        codeNotResent: '验证码重新发送失败',
        statusCheckFailed: '无法检查状态',
      },
      countries: {
        china: '中国',
        usa: '美国',
        turkey: '土耳其',
        korea: '韩国',
        japan: '日本',
      },
    },
  },
} as const;
