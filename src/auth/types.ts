type ZSession =  {
    user_type: string, // 'individual/res_no_nn',
    email: string, // 'facinick@gmail.com',
    user_name: string, // 'Shriyans Kapoor',
    user_shortname: string, // 'Shriyans',
    broker: string, // 'ZERODHA',
    exchanges: Array<string> // [ 'BSE', 'BFO', 'NFO', 'NSE', 'MF' ],
    products: Array<string> // [ 'CNC', 'NRML', 'MIS', 'BO', 'CO' ],
    order_types: Array<string> // [ 'MARKET', 'LIMIT', 'SL', 'SL-M' ],
    avatar_url: string, // null,
    user_id: string, // 'EYD766',
    api_key: string, // 'qbpvv4bxneh2qv2y',
    access_token: string, // 'Jj0a2D2KgsTLT4lerarKAWaUIWPVRs75',
    public_token: string, // '0s06k9KQqf3BWuDZZwlydm4wO5VKgQKk',
    refresh_token: string, // '',
    enctoken?: string, // 'BHgMX10Gg+n6fU+zjAQAt7NtG1uCOTQWTvhbG4mcOHG/XScUQ28ZFH15vHIa0y7dj/MUR/1kLkU8GQzYdciIoFroEFKNXLP5JyW1SfYZt/MA3tm0lnVI41+8BjTC4AI=',
    login_time: string, // 2024-07-12T03:49:06.000Z,
    meta: { demat_consent: string }, //{ demat_consent: 'consent' }
  }
  