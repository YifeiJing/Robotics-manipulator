import numpy as np


def Ri(theta):
	theta = theta/180 * np.pi
	return np.array([[1, 0, 0],[0, np.cos(theta), -np.sin(theta)],[0, np.sin(theta), np.cos(theta)]])

def Rj(theta):
	theta = theta/180 * np.pi
	return np.array([[np.cos(theta), 0, np.sin(theta)], [0, 1, 0], [-np.sin(theta), 0, np.cos(theta)]])

def Rk(theta):
	theta = theta/180 * np.pi
	return np.array([[np.cos(theta), -np.sin(theta), 0], [np.sin(theta), np.cos(theta), 0], [0, 0, 1]])


if __name__ == "__main__":
	# print(Ri(-90),Rj(-90),np.matmul(Ri(-90), Rj(-90)))
	print(np.dot(Rk(-90),[1,0,0]))
