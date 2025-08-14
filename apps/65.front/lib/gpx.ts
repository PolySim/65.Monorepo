// lib/gpx.ts

export interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
  name?: string;
  desc?: string;
}

export interface GPXTrack {
  name?: string;
  points: GPXPoint[];
}

export interface GPXData {
  name?: string;
  description?: string;
  tracks: GPXTrack[];
  waypoints: GPXPoint[];
}

export class SimpleGPXParser {
  parse(gpxString: string): GPXData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxString, "text/xml");

    // Vérifier les erreurs de parsing
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Erreur de parsing XML: " + parserError.textContent);
    }

    const result: GPXData = {
      tracks: [],
      waypoints: [],
    };

    // Métadonnées générales
    const nameElement = xmlDoc.querySelector("gpx > name");
    if (nameElement) {
      result.name = nameElement.textContent || undefined;
    }

    const descElement = xmlDoc.querySelector("gpx > desc");
    if (descElement) {
      result.description = descElement.textContent || undefined;
    }

    // Parser les waypoints
    const waypoints = xmlDoc.querySelectorAll("wpt");
    waypoints.forEach((wpt) => {
      const point = this.parsePoint(wpt);
      if (point) {
        result.waypoints.push(point);
      }
    });

    // Parser les tracks
    const tracks = xmlDoc.querySelectorAll("trk");
    tracks.forEach((trk) => {
      const track = this.parseTrack(trk);
      if (track) {
        result.tracks.push(track);
      }
    });

    return result;
  }

  private parsePoint(element: Element): GPXPoint | null {
    const lat = parseFloat(element.getAttribute("lat") || "");
    const lon = parseFloat(element.getAttribute("lon") || "");

    if (isNaN(lat) || isNaN(lon)) {
      return null;
    }

    const point: GPXPoint = { lat, lon };

    // Elevation
    const eleElement = element.querySelector("ele");
    if (eleElement && eleElement.textContent) {
      const ele = parseFloat(eleElement.textContent);
      if (!isNaN(ele)) {
        point.ele = ele;
      }
    }

    // Time
    const timeElement = element.querySelector("time");
    if (timeElement && timeElement.textContent) {
      const time = new Date(timeElement.textContent);
      if (!isNaN(time.getTime())) {
        point.time = time;
      }
    }

    // Name
    const nameElement = element.querySelector("name");
    if (nameElement && nameElement.textContent) {
      point.name = nameElement.textContent;
    }

    // Description
    const descElement = element.querySelector("desc");
    if (descElement && descElement.textContent) {
      point.desc = descElement.textContent;
    }

    return point;
  }

  private parseTrack(trkElement: Element): GPXTrack | null {
    const track: GPXTrack = {
      points: [],
    };

    // Nom du track
    const nameElement = trkElement.querySelector("name");
    if (nameElement && nameElement.textContent) {
      track.name = nameElement.textContent;
    }

    // Parser tous les points du track (segments)
    const trackPoints = trkElement.querySelectorAll("trkpt");
    trackPoints.forEach((trkpt) => {
      const point = this.parsePoint(trkpt);
      if (point) {
        track.points.push(point);
      }
    });

    return track.points.length > 0 ? track : null;
  }

  // Méthodes utilitaires
  getTotalDistance(track: GPXTrack): number {
    if (track.points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < track.points.length; i++) {
      totalDistance += this.haversineDistance(
        track.points[i - 1],
        track.points[i]
      );
    }
    return totalDistance;
  }

  private haversineDistance(point1: GPXPoint, point2: GPXPoint): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lon - point1.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  getElevationGain(track: GPXTrack): number {
    let gain = 0;
    for (let i = 1; i < track.points.length; i++) {
      const prevEle = track.points[i - 1].ele;
      const currEle = track.points[i].ele;

      if (prevEle !== undefined && currEle !== undefined) {
        const diff = currEle - prevEle;
        if (diff > 0) {
          gain += diff;
        }
      }
    }
    return gain;
  }

  getBounds(track: GPXTrack): {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null {
    if (track.points.length === 0) return null;

    let minLat = track.points[0].lat;
    let maxLat = track.points[0].lat;
    let minLon = track.points[0].lon;
    let maxLon = track.points[0].lon;

    track.points.forEach((point) => {
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
      minLon = Math.min(minLon, point.lon);
      maxLon = Math.max(maxLon, point.lon);
    });

    return { minLat, maxLat, minLon, maxLon };
  }
}
