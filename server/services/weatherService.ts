interface WeatherResponse {
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  name: string;
  sys: {
    country: string;
  };
}

interface WeatherData {
  condition: string;
  temperature: number;
  location: string;
  isBunkWeather: boolean;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not found. Weather features will be limited.');
    }
  }

  async getWeatherData(lat: number = 19.0760, lon: number = 72.8777): Promise<WeatherData> {
    if (!this.apiKey) {
      return this.getFallbackWeather();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const data: WeatherResponse = await response.json();
      
      return {
        condition: data.weather[0].description,
        temperature: Math.round(data.main.temp),
        location: `${data.name}, ${data.sys.country}`,
        isBunkWeather: this.isBunkWeather(data),
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getFallbackWeather();
    }
  }

  private isBunkWeather(data: WeatherResponse): boolean {
    const weather = data.weather[0];
    const temp = data.main.temp;
    
    // Perfect bunking conditions
    return (
      weather.main === 'Rain' ||
      weather.main === 'Thunderstorm' ||
      weather.main === 'Snow' ||
      temp > 35 || // Too hot
      temp < 5 ||  // Too cold
      weather.description.includes('fog') ||
      weather.description.includes('mist')
    );
  }

  private getFallbackWeather(): WeatherData {
    return {
      condition: 'Partly Cloudy',
      temperature: 28,
      location: 'Mumbai, India',
      isBunkWeather: false,
    };
  }

  calculateWeatherScore(weatherData: WeatherData): number {
    let score = 50; // Base score

    // Weather condition scoring
    if (weatherData.condition.includes('rain')) {
      score += 30;
    } else if (weatherData.condition.includes('storm')) {
      score += 35;
    } else if (weatherData.condition.includes('snow')) {
      score += 40;
    } else if (weatherData.condition.includes('fog') || weatherData.condition.includes('mist')) {
      score += 25;
    } else if (weatherData.condition.includes('clear') || weatherData.condition.includes('sunny')) {
      score -= 10;
    }

    // Temperature scoring
    if (weatherData.temperature > 35) {
      score += 20; // Too hot
    } else if (weatherData.temperature < 5) {
      score += 25; // Too cold
    } else if (weatherData.temperature >= 20 && weatherData.temperature <= 30) {
      score -= 5; // Perfect weather
    }

    return Math.max(0, Math.min(100, score));
  }
}
