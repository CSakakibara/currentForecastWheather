import axios from "axios";
import dayjs from "dayjs";

export async function getGeocodingWeatherData(locale) {
  return axios
    .get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${locale}&limit=1&appid=180941f68139fba12f166dc35d9b688b`
    )
    .then((response) => {
      const { lat, lon } = response.data[0];
      return { latitude: lat, longitude: lon };
    })
    .catch((error) => {
      console.log(error);
    });
}

function getHistoricalData(latitude, longitude, time) {
  return axios
    .get(
      `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${time}&units=metric&appid=180941f68139fba12f166dc35d9b688b`
    )
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
}

function getForecastData(latitude, longitude) {
  return axios
    .get(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,minutely,alerts&units=metric&appid=180941f68139fba12f166dc35d9b688b`
    )
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
}

export async function getDailyWeather(date, latitude, longitude) {
  if (date.getTime() + 86400000 < new Date().getTime()) {
    const unixTimeDate = date.getTime() / 1000;

    const pastData = await getHistoricalData(latitude, longitude, unixTimeDate);

    return pastData.current;
  } else {
    const forecastData = await getForecastData(latitude, longitude);
    const dayIndex = dayjs(date).diff(dayjs(), "day");
    const dailyData = forecastData.daily[dayIndex];
    dailyData.temp = dailyData.temp.day;
    return dailyData;
  }
}

export async function getHourlyWeatherByDay(date, latitude, longitude) {
  if (date.getTime() + 86400000 < new Date().getTime()) {
    const unixTimeDate = date.getTime() / 1000;

    const pastData = await getHistoricalData(latitude, longitude, unixTimeDate);

    return pastData;
  } else {
    const forecastData = await getForecastData(latitude, longitude);

    const isToday = date.getDate() - new Date().getDate() === 0;
    if (isToday) {
      forecastData.hourly = forecastData.hourly.slice(0, 24);
    } else {
      forecastData.hourly = forecastData.hourly.slice(24, 48);
    }
    return forecastData;
  }
}

function isAvailable(date) {
  if (
    dayjs(date) >= dayjs().subtract(5, "day") &&
    dayjs(date) <= dayjs().add(7, "day")
  ) {
    return true;
  }
  return false;
}

export async function getWeeklyWeatherByDay(date, latitude, longitude) {
  const daysUntilSundayFromDate = date.getDay();
  const weeklyData = { weekly: [] };
  const sundayDate = dayjs(date).subtract(daysUntilSundayFromDate, "day").$d;
  const forecastData = await getForecastData(latitude, longitude);

  if (sundayDate.getTime() + 86400000 < new Date().getTime()) {
    const daysUntilSundayFromToday = new Date().getDay();
    var index = 0;
    for (var i = daysUntilSundayFromToday; i > 0; i--) {
      var iDay = dayjs(new Date()).subtract(i, "day").$d;
      if (isAvailable(iDay)) {
        const unixTimeDate = Math.round(iDay.getTime() / 1000);
        const iData = await getHistoricalData(
          latitude,
          longitude,
          unixTimeDate
        );
        weeklyData.weekly[index] = iData.current;
      } else {
        debugger;
        weeklyData.weekly[index] = {
          temp: "indisponível",
          humidity: "indisponível",
          wind_speed: "indisponível",
          dt: iDay.getTime() / 1000,
        };
      }
      index++;
    }
    const daysRemaining = 7 - daysUntilSundayFromToday;
    for (var j = 0; j < daysRemaining; j++) {
      weeklyData.weekly[index] = forecastData.daily[j];
      weeklyData.weekly[index].temp = weeklyData.weekly[index].temp.day;
      index++;
    }
    return weeklyData;
  } else {
    const sundayIndex = Math.ceil(dayjs(sundayDate).diff(dayjs(), "day", true));
    for (var k = sundayIndex; k < sundayIndex + 7; k++) {
      var dayK = dayjs().add(k, "day").$d;
      if (isAvailable(dayK)) {
        weeklyData.weekly[k] = forecastData.daily[k];
        weeklyData.weekly[k].temp = weeklyData.weekly[k].temp.day;
      } else {
        debugger;
        weeklyData.weekly[k] = {
          temp: "indisponível",
          humidity: "indisponível",
          wind_speed: "indisponível",
          dt: dayK.getTime() / 1000,
        };
      }
    }
    return weeklyData;
  }
}
