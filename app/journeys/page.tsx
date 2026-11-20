
"use client";


import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type ActiveJourney = {
  id: string;
  origin: string;
  destination: string;
  arrival: string;
};

type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export default function JourneysPage() {
  const [supabase] = useState(() => createClient());

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [arrival, setArrival] = useState("");

  const [activeJourney, setActiveJourney] =
    useState<ActiveJourney | null>(null);

  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);

  const [isLoadingJourney, setIsLoadingJourney] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [journeyMessage, setJourneyMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // 1. Restore an active journey after loading or refreshing.
  useEffect(() => {
    let cancelled = false;

    async function loadActiveJourney() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (!cancelled) {
            setJourneyMessage(
              "Please sign in to manage your journeys."
            );
          }
          return;
        }

        const { data, error } = await supabase
          .from("journeys")
          .select("id, origin, destination, expected_arrival")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (data) {
          setActiveJourney({
            id: data.id,
            origin: data.origin,
            destination: data.destination,
            arrival: data.expected_arrival,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load active journey:", error);

          setJourneyMessage(
            `Could not load your active journey: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingJourney(false);
        }
      }
    }

    void loadActiveJourney();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // 2. Get a one-time location independently of journey tracking.
  function handleGetCurrentLocation() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setJourneyMessage(
        "Location access requires HTTPS and browser geolocation."
      );
      return;
    }

    if (isLocating) return;

    setIsLocating(true);
    setJourneyMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });

        setJourneyMessage(
          "Your current location has been updated."
        );
        setIsLocating(false);
      },
      (error) => {
        const reasons: Record<number, string> = {
          1: "Location permission was denied. Check your browser settings.",
          2: "Your device could not determine its location. Check location services.",
          3: "The location request timed out. Please try again.",
        };

        setJourneyMessage(
          reasons[error.code] ??
            "Could not get your current location."
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  }

  // 3. Track an active journey and target one database save every
  // 30 seconds. The first fresh position is saved immediately.


  useEffect(() => {
    if (!activeJourney) return;

    const journeyId = activeJourney.id;

  if (!window.isSecureContext || !navigator.geolocation) {

      setJourneyMessage(
        "Your journey is active, but location tracking requires HTTPS and browser geolocation."
      );
      return;
    }



    const SAVE_INTERVAL_MS = 30_000;
    const MAX_POSITION_AGE_MS = 60_000;

    let isCurrent = true;
    let latestPosition: GeolocationPosition | null = null;
    let lastSaveAttemptAt = 0;
    let isSaving = false;

    setJourneyMessage(
      "Journey active. Waiting for your location..."
    );

    async function saveLatestPosition() {
      if (!isCurrent || !latestPosition || isSaving) return;

      const now = Date.now();

      if (
        lastSaveAttemptAt !== 0 &&
        now - lastSaveAttemptAt < SAVE_INTERVAL_MS
      ) {
        return;
      }

      const position = latestPosition;

      if (now - position.timestamp > MAX_POSITION_AGE_MS) {
        return;
      }

      isSaving = true;
      lastSaveAttemptAt = Date.now();

      try {
        const { error } = await supabase
          .from("journey_locations")
          .insert({
            journey_id: journeyId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy_meters: position.coords.accuracy,
          });

        if (!isCurrent) return;

        if (error) {
          console.error("Failed to save location:", error);

          setJourneyMessage(
            `Location save failed: ${error.message}`
          );
          return;
        }

        console.log("Journey location saved:", {
          journeyId: journeyId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });

        setJourneyMessage(
          `Journey active. Location recorded (accuracy ±${Math.round(
            position.coords.accuracy
          )} m).`
        );
      } catch (error) {
        if (isCurrent) {
          console.error("Unexpected location save error:", error);

          setJourneyMessage(
            "Could not save your location. Tracking will retry."
          );
        }
      } finally {
        isSaving = false;
      }
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isCurrent) return;

        latestPosition = position;

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });

        // Save the first fresh position immediately.
        if (lastSaveAttemptAt === 0) {
          void saveLatestPosition();
        }
      },
      (error) => {
        if (!isCurrent) return;

        console.error(
          "Location error:",
          error.code,
          error.message
        );

        const reasons: Record<number, string> = {
          1: "Location permission was denied. Check browser permissions.",
          2: "Your device could not determine its location. Check location services.",
          3: "Location request timed out. Waiting for another update.",
        };

        setJourneyMessage(
          `Location tracking issue: ${
            reasons[error.code] ?? error.message
          }`
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );

    const intervalId = window.setInterval(() => {
      void saveLatestPosition();
    }, 1000);

    return () => {
      isCurrent = false;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(intervalId);
    };
  }, [activeJourney, supabase]);

  // 4. Create a journey.
  async function handleStartJourney(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isStarting || isLoadingJourney || activeJourney) return;

    setIsStarting(true);
    setJourneyMessage("Checking your sign-in...");

    try {
      if (
        !origin.trim() ||
        !destination.trim() ||
        !arrival
      ) {
        setJourneyMessage(
          "Please enter your starting point, destination, and expected arrival."
        );
        return;
      }

      const arrivalDate = new Date(arrival);

      if (Number.isNaN(arrivalDate.getTime())) {
        setJourneyMessage(
          "Please enter a valid expected arrival time."
        );
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User authentication failed:", userError);

        setJourneyMessage(
          `Sign-in failed: ${
            userError?.message ?? "No authenticated user found."
          } Please sign in again.`
        );
        return;
      }

      setJourneyMessage("Creating your journey...");

      const { data, error } = await supabase
        .from("journeys")
        .insert({
          user_id: user.id,
          origin: origin.trim(),
          destination: destination.trim(),
          expected_arrival: arrivalDate.toISOString(),
        })
        .select("id, origin, destination, expected_arrival")
        .single();

      if (error) {
        console.error("Failed to create journey:", error);

        setJourneyMessage(
          `Could not create journey: ${error.message}`
        );
        return;
      }

      // Remove the previous position until this journey gets a new fix.
      setCurrentLocation(null);

      setActiveJourney({
        id: data.id,
        origin: data.origin,
        destination: data.destination,
        arrival: data.expected_arrival,
      });

      setJourneyMessage(
        "Journey created. Getting your starting location..."
      );
    } catch (error) {
      console.error("Unexpected start journey error:", error);

      setJourneyMessage(
        `Something went wrong: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    } finally {
      setIsStarting(false);
    }
  }

  // 5. Complete the journey and clear its displayed position.
  async function handleEndJourney() {
    if (!activeJourney || isEnding) return;

    setIsEnding(true);
    setJourneyMessage("Ending your journey...");

    try {
      const { data: updatedJourney, error } = await supabase
        .from("journeys")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", activeJourney.id)
        .eq("status", "active")
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Failed to end journey:", error);

        setJourneyMessage(
          `Could not end journey: ${error.message}`
        );
        return;
      }

      if (!updatedJourney) {
        setJourneyMessage(
          "The journey was not marked as completed. Refresh and check its status before trying again."
        );
        return;
      }

      setActiveJourney(null);
      setCurrentLocation(null);
      setJourneyMessage(
        "Journey ended. You can still check your current location."
      );
    } catch (error) {
      console.error("Unexpected end journey error:", error);

      setJourneyMessage(
        `Could not end journey: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      );
    } finally {
      setIsEnding(false);
    }
  }

  // 6. Render the interface.
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-900">
          SAFENET Journeys
        </h1>

        {journeyMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 break-words rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
          >
            {journeyMessage}
          </p>
        )}

        {isLoadingJourney && (
          <p className="mt-8 rounded-2xl bg-white p-6 text-slate-700 shadow-sm">
            Checking for an active journey...
          </p>
        )}

        {!isLoadingJourney && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              My Current Location
            </h2>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {isLocating
                ? "Getting location..."
                : "Refresh My Location"}
            </button>

            {currentLocation ? (
              <div className="mt-4 space-y-2 break-words text-sm text-slate-700">
                <p>
                  <strong>Latitude:</strong>{" "}
                  {currentLocation.latitude.toFixed(6)}
                </p>

                <p>
                  <strong>Longitude:</strong>{" "}
                  {currentLocation.longitude.toFixed(6)}
                </p>

                <p>
                  <strong>Reported accuracy:</strong>{" "}
                  ±{Math.round(currentLocation.accuracy)} metres
                </p>

                <p>
                  <strong>Position timestamp:</strong>{" "}
                  {new Date(
                    currentLocation.timestamp
                  ).toLocaleString()}
                </p>

                <a
                  className="inline-block underline"
                  href={`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Google Maps
                </a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Tap the button to get your current location.
              </p>
            )}
          </section>
        )}

        {!isLoadingJourney && !activeJourney && (
          <form
            onSubmit={handleStartJourney}
            className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm"
          >
            <div>
              <label
                htmlFor="origin"
                className="block text-sm font-medium text-slate-700"
              >
                Where are you starting from?
              </label>

              <input
                id="origin"
                type="text"
                required
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder="e.g. Osogbo"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="destination"
                className="block text-sm font-medium text-slate-700"
              >
                Where are you going?
              </label>

              <input
                id="destination"
                type="text"
                required
                value={destination}
                onChange={(event) =>
                  setDestination(event.target.value)
                }
                placeholder="e.g. Lagos"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="arrival"
                className="block text-sm font-medium text-slate-700"
              >
                Expected arrival
              </label>

              <input
                id="arrival"
                type="datetime-local"
                required
                value={arrival}
                onChange={(event) =>
                  setArrival(event.target.value)
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isStarting || isLoadingJourney}
              className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStarting ? "Starting..." : "Start Journey"}
            </button>
          </form>
        )}

        {!isLoadingJourney && activeJourney && (
          <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-green-600">
              🟢 Journey Active
            </p>

            <h2 className="mt-4 break-words text-2xl font-bold text-slate-900">
              {activeJourney.origin} → {activeJourney.destination}
            </h2>

            <p className="mt-3 break-words text-slate-600">
              Expected arrival:{" "}
              {new Date(activeJourney.arrival).toLocaleString()}
            </p>

            <button
              type="button"
              onClick={handleEndJourney}
              disabled={isEnding}
              className="mt-6 w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEnding ? "Ending..." : "End Journey"}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
