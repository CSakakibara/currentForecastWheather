import "./App.css";

import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import React, { useState } from "react";
import {
  getDailyWeather,
  getGeocodingWeatherData,
  getHourlyWeatherByDay,
  getWeeklyWeatherByDay,
} from "./api";

const changeDayFromToday = (referenceDay) => {
  const today = dayjs();
  if (referenceDay > 0) {
    return today.add(referenceDay, "day");
  } else {
    referenceDay = -referenceDay;
    return today.subtract(referenceDay, "day");
  }
};

const celsiusToFahrenheit = (celsius) => {
  if (celsius === "indisponível") {
    return "indisponível";
  }

  return parseFloat(((celsius * 9) / 5 + 32).toFixed(2));
};

const Calendar = ({
  startDate,
  setStartDate,
  tempViewMode,
  handleGetWeatherData,
}) => {
  return (
    <div>
      Selecione o dia:
      <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        minDate={changeDayFromToday(-5).$d}
        maxDate={
          tempViewMode === "Hora"
            ? changeDayFromToday(1).$d
            : changeDayFromToday(7).$d
        }
        showDisabledMonthNavigation
        inline
      />
      <button
        onClick={() => {
          handleGetWeatherData(startDate);
        }}
      >
        Escolher data
      </button>
    </div>
  );
};

const Filter = ({
  locale,
  setLocale,
  tempViewMode,
  setTempViewMode,
  startDate,
}) => {
  return (
    <form>
      <label>Localidade </label>
      <input
        type="text"
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
      />
      <label>Exibir por: </label>
      <select
        value={tempViewMode}
        onChange={(e) => setTempViewMode(e.target.value)}
      >
        <option value="Dia">Dia</option>
        <option value="Semana">Semana</option>
        <option
          value="Hora"
          disabled={
            dayjs(startDate).isAfter(changeDayFromToday(1)) ||
            dayjs(startDate).isBefore(changeDayFromToday(-5))
          }
        >
          Hora em hora
        </option>
      </select>
    </form>
  );
};

const OutcomeDay = ({ data, locale }) => {
  const dayDate = new Date(data?.dt * 1000).toLocaleDateString();
  return (
    <div>
      <p>{locale + " " + dayDate}</p>
      <p>
        Temperatura: {data?.temp}
        °C /{celsiusToFahrenheit(data?.temp)}
        °F
      </p>
      <p>
        Umidade:
        {data?.humidity} %
      </p>
      <p>
        Velocidade do vento:
        {data?.wind_speed} m/s
      </p>
    </div>
  );
};

const OutcomeWeek = ({ data, locale }) => {
  return (
    <div>
      <div>{locale}</div>
      {data?.weekly?.map((week, index) => (
        <div key={index}>
          <div>{new Date(week.dt * 1000).toLocaleDateString()}</div>
          <div>
            Temperatura:{week.temp}°C/{celsiusToFahrenheit(week.temp)}°F
          </div>
          <div>Umidade:{week.humidity}</div>
          <div>Velocidade do vento:{week.wind_speed}</div>
        </div>
      ))}
    </div>
  );
};

const OutcomeHour = ({ data, locale }) => {
  return (
    <div>
      <div>{locale}</div>
      {data?.hourly?.map((hour, index) => (
        <div key={index}>
          <div>
            {new Date(hour.dt * 1000).toLocaleDateString() +
              " " +
              new Date(hour.dt * 1000).getHours()}
            :00
          </div>
          <div>
            Temperatura:{hour.temp}°C/{celsiusToFahrenheit(hour.temp)}°F
          </div>
          <div>Umidade:{hour.humidity}</div>
          <div>Velocidade do vento:{hour.wind_speed}</div>
        </div>
      ))}
    </div>
  );
};

const WeatherApp = () => {
  const [datePicked, setDatePicked] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [locale, setLocale] = useState("Uberlândia,BR");
  const [tempViewMode, setTempViewMode] = useState("Dia");
  const [viewMode, setViewMode] = useState("Dia");
  const [hourlyData, setHourlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);

  const handleGetWeatherData = async (date) => {
    const { latitude, longitude } = await getGeocodingWeatherData(locale);

    if (viewMode === "Dia") {
      const data = await getDailyWeather(date, latitude, longitude);
      setDailyData(data);
    } else if (viewMode === "Hora") {
      const data = await getHourlyWeatherByDay(date, latitude, longitude);
      setHourlyData(data);
    } else if (viewMode === "Semana") {
      const data = await getWeeklyWeatherByDay(date, latitude, longitude);
      setWeeklyData(data);
    }
    setDatePicked(true);
    setViewMode(tempViewMode);
  };

  return (
    <div>
      <Filter
        locale={locale}
        setLocale={setLocale}
        tempViewMode={tempViewMode}
        setTempViewMode={setTempViewMode}
        startDate={startDate}
      />
      <Calendar
        startDate={startDate}
        setStartDate={setStartDate}
        tempViewMode={tempViewMode}
        handleGetWeatherData={handleGetWeatherData}
      />
      {datePicked ? (
        viewMode === "Dia" ? (
          <OutcomeDay data={dailyData} locale={locale} />
        ) : viewMode === "Semana" ? (
          <OutcomeWeek data={weeklyData} locale={locale} />
        ) : (
          <OutcomeHour data={hourlyData} locale={locale} />
        )
      ) : null}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <WeatherApp />
      </header>
    </div>
  );
}

export default App;
