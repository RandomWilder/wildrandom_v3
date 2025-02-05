 
import { FC } from 'react';
import useAuth from '../../hooks/useAuth';
import Card from '../../components/common/Card';

const ProfilePage: FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account and view your activity</p>
      </div>

      {/* Profile Information */}
      <Card variant="default" className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Username</label>
              <p className="mt-1 text-gray-900">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-gray-900">{user.email}</p>
            </div>
            {user.first_name && (
              <div>
                <label className="block text-sm font-medium text-gray-500">First Name</label>
                <p className="mt-1 text-gray-900">{user.first_name}</p>
              </div>
            )}
            {user.last_name && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Name</label>
                <p className="mt-1 text-gray-900">{user.last_name}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Account Balance */}
      <Card variant="featured" className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Available</label>
              <p className="mt-1 text-2xl font-bold text-indigo-600">
                ${user.balance.available.toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Pending</label>
              <p className="mt-1 text-2xl font-bold text-gray-600">
                ${user.balance.pending.toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(user.balance.last_updated).toLocaleString()}
          </p>
        </div>
      </Card>

      {/* Verification Status */}
      <Card 
        variant={user.is_verified ? "default" : "featured"} 
        className="p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account Status</h2>
            <p className="mt-1 text-sm text-gray-600">
              {user.is_verified 
                ? "Your account is fully verified" 
                : "Please verify your account to unlock all features"}
            </p>
          </div>
          {!user.is_verified && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Verify Now
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;