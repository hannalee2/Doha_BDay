/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Car, 
  Gift, 
  ShieldCheck,
  ChevronRight,
  Info,
  LogOut,
  Lock,
  Loader2,
  Trash2
} from 'lucide-react';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  onSnapshot, 
  orderBy,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';

export default function App() {
  const [formState, setFormState] = useState({
    name: '',
    adults: 1,
    children: 0,
    status: 'pending', // pending, submitting, success
  });

  const [user, setUser] = useState<User | null>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Case-insensitive check to avoid login mismatches
      const adminEmail = 'HungryHanna@gmail.com'.toLowerCase();
      setIsAdmin(u?.email?.toLowerCase() === adminEmail);
      setAuthInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (isAdmin && showAdmin) {
      const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRsvps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => {
        console.error("Dashboard error:", err);
      });
      return () => unsubscribe();
    }
  }, [isAdmin, showAdmin]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, status: 'submitting' }));
    
    try {
      await addDoc(collection(db, 'rsvps'), {
        name: formState.name,
        adults: formState.adults,
        children: formState.children,
        createdAt: serverTimestamp(),
      });
      setFormState(prev => ({ ...prev, status: 'success' }));
    } catch (error) {
      console.error(error);
      setFormState(prev => ({ ...prev, status: 'pending' }));
      alert("Paws in... we lost connection. Please try again!");
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const totalAdults = rsvps.reduce((acc, curr) => acc + (curr.adults || 0), 0);
  const totalChildren = rsvps.reduce((acc, curr) => acc + (curr.children || 0), 0);

  if (formState.status === 'success') {
    return (
      <div className="min-h-screen bg-chase-blue flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-chase-yellow" />
          <div className="bg-chase-blue w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 badge-glow border-4 border-chase-yellow">
            <span className="text-4xl">🐾</span>
          </div>
          <h2 className="text-3xl font-black text-chase-blue mb-2 uppercase">Roger That!</h2>
          <p className="text-slate-600 mb-6 font-medium">
            RSVP received! Chase is on the case for Doha's 4th Birthday!
          </p>
          <button 
            onClick={() => setFormState(prev => ({ ...prev, status: 'pending', name: '' }))}
            className="w-full py-4 bg-chase-blue text-white rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
          >
            DONE
          </button>
        </motion.div>
      </div>
    );
  }

  if (showAdmin && isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-12">
        <div className="bg-chase-blue p-6 text-white flex justify-between items-center sticky top-0 z-50">
          <button 
            onClick={() => setShowAdmin(false)}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/30 transition-all"
          >
            ← BACK TO INVITATION
          </button>
          <div className="text-right">
            <h1 className="font-black text-sm uppercase italic">Patrol Command</h1>
            <button 
              onClick={() => signOut(auth)}
              className="text-[10px] font-bold text-blue-200 underline"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-chase-yellow">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Guests</p>
              <p className="text-3xl font-black text-chase-blue">{totalAdults + totalChildren}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-400">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adults</p>
              <p className="text-3xl font-black text-chase-blue">{totalAdults}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-chase-red">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Children</p>
              <p className="text-3xl font-black text-chase-blue">{totalChildren}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Guest Report</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-4">Guest Name</th>
                  <th className="px-6 py-4">Adults</th>
                  <th className="px-6 py-4">Children</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{rsvp.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rsvp.adults}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rsvp.children}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-full">Attending</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteDoc(doc(db, 'rsvps', rsvp.id))}
                        className="text-slate-300 hover:text-chase-red"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {rsvps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                      No guests have reported for duty yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Hero Section */}
      <div className="relative h-72 bg-chase-blue overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 paw-pattern opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-chase-blue/30" />
        
        {isAdmin && !showAdmin && (
          <button 
            onClick={() => setShowAdmin(true)}
            className="absolute bottom-4 right-4 z-30 bg-chase-yellow text-chase-blue px-4 py-2 rounded-full font-black text-[10px] uppercase shadow-lg animate-bounce"
          >
            📋 VIEW GUEST LIST
          </button>
        )}
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-center px-4"
        >
          <div className="bg-chase-yellow text-chase-blue px-4 py-1 rounded-full font-black text-sm mb-3 inline-block shadow-lg uppercase tracking-wider">
            No Job is Too Big!
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-xl flex flex-col uppercase italic leading-none">
            <span>Doha is turning</span>
            <span className="text-chase-yellow text-7xl md:text-9xl mt-2 flex items-center justify-center gap-4">
              4! 
              <span className="text-6xl md:text-8xl filter drop-shadow-lg">🐾</span>
            </span>
          </h1>
        </motion.div>
      </div>

      <div className="max-w-md mx-auto -mt-10 px-4 relative z-20">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] shadow-2xl p-8 mb-6 border-b-8 border-chase-yellow"
        >
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="text-chase-blue w-6 h-6" />
            <h2 className="text-lg font-black text-chase-blue uppercase tracking-tight">Mission Briefing</h2>
          </div>

          <div className="space-y-6">
            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl flex flex-col gap-2">
                <Calendar className="text-chase-blue w-5 h-5" />
                <div>
                  <p className="text-xs font-bold text-chase-blue/60 uppercase">Date</p>
                  <p className="text-sm font-black text-slate-900">May 9th</p>
                  <p className="text-xs font-medium text-slate-500 italic">Saturday • 4 PM</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl flex flex-col gap-2">
                <MapPin className="text-chase-blue w-5 h-5" />
                <div>
                  <p className="text-xs font-bold text-chase-blue/60 uppercase">Location</p>
                  <p className="text-sm font-black text-slate-900">Juanita Beach</p>
                  <p className="text-xs font-medium text-slate-500 italic leading-tight">9703 NE Juanita Dr</p>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=9703+NE+Juanita+Dr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-chase-blue font-bold underline mt-1 block"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="p-5 bg-chase-blue text-white rounded-2xl flex gap-4 items-start shadow-inner">
              <div className="bg-white/20 p-2 rounded-lg mt-1">
                <Info size={18} />
              </div>
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-2">
                  Find the Shelter
                </p>
                <p className="text-sm text-blue-100 font-medium">
                  We'll be at the picnic shelter closest to the playground. Look for the Paw Patrol balloons!
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
               <div className="flex items-start gap-3">
                <Car className="text-chase-blue w-5 h-5 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Parking Recon</p>
                  <p className="text-xs text-slate-500">Available at the park. If full, check the additional lot across the street.</p>
                </div>
              </div>

               <div className="flex items-start gap-3">
                <Gift className="text-chase-red w-5 h-5 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Note for Pups</p>
                  <p className="text-xs text-slate-500 italic">"No gifts please" — your presence is the best patrol!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RSVP FORM */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] shadow-xl p-8 mb-8 border-t-8 border-chase-blue"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-chase-blue w-6 h-6" />
            <h2 className="text-lg font-black text-chase-blue uppercase tracking-tight">Report for Duty</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Guest Name</label>
              <input 
                required
                type="text"
                placeholder="Ex: Marshall"
                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-chase-blue focus:outline-none transition-colors"
                value={formState.name}
                onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Adults</label>
                <div className="flex items-center">
                  <button 
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, adults: Math.max(0, prev.adults - 1) }))}
                    className="w-12 h-12 rounded-l-xl bg-slate-100 border-2 border-r-0 border-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                  >-</button>
                  <div className="w-full h-12 border-2 border-slate-100 flex items-center justify-center font-black text-slate-800">
                    {formState.adults}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, adults: prev.adults + 1 }))}
                    className="w-12 h-12 rounded-r-xl bg-slate-100 border-2 border-l-0 border-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                  >+</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Children</label>
                <div className="flex items-center">
                  <button 
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, children: Math.max(0, prev.children - 1) }))}
                    className="w-12 h-12 rounded-l-xl bg-slate-100 border-2 border-r-0 border-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                  >-</button>
                  <div className="w-full h-12 border-2 border-slate-100 flex items-center justify-center font-black text-slate-800">
                    {formState.children}
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, children: prev.children + 1 }))}
                    className="w-12 h-12 rounded-r-xl bg-slate-100 border-2 border-l-0 border-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200"
                  >+</button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={formState.status === 'submitting'}
              className="w-full py-5 bg-chase-yellow text-chase-blue rounded-2xl font-black text-lg uppercase shadow-lg shadow-yellow-200 flex items-center justify-center gap-2 hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
            >
              {formState.status === 'submitting' ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" /> Paws in...
                </div>
              ) : (
                <>
                  Ready for Action <ChevronRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer Admin Access */}
        <div className="text-center mt-4">
          {!user && (
            <button 
              onClick={handleLogin}
              className="px-4 py-2 border border-slate-200 rounded-full text-[10px] font-black text-slate-400 hover:text-chase-blue hover:border-chase-blue uppercase tracking-widest transition-all"
            >
              Organizer Login
            </button>
          )}
          {isAdmin && !showAdmin && (
            <button 
              onClick={() => setShowAdmin(true)}
              className="px-6 py-3 bg-chase-blue text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              📊 Open Guest Dashboard
            </button>
          )}
          {user && !isAdmin && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase italic">
                Logged in as {user.email}
              </p>
              <p className="text-[10px] text-chase-red font-bold uppercase">
                Note: This email is not on the Admin list.
              </p>
              <button 
                onClick={() => signOut(auth)}
                className="text-[10px] font-bold text-chase-blue underline uppercase"
              >
                Sign out and try another account
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center p-6 bg-slate-100/50 mt-8">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Paw Patrol is a trademark of Spin Master. Developed for Doha's 4th Birthday Mission.
        </p>
      </footer>
    </div>
  );
}
